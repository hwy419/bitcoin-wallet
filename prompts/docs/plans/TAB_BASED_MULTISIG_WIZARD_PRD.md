# Product Requirements Document: Tab-Based Multisig Wizard

**Document Type:** Feature Enhancement PRD
**Feature:** Move Multisig Account Creation Wizard from Popup to Browser Tab
**Created:** October 13, 2025
**Status:** Proposed - Pending Approval
**Priority:** P1 - High Priority UX Fix
**Target Version:** 0.9.0

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [User Impact Analysis](#user-impact-analysis)
4. [Proposed Solution](#proposed-solution)
5. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
6. [User Flow Specifications](#user-flow-specifications)
7. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
8. [Technical Requirements](#technical-requirements)
9. [Integration with Existing Features](#integration-with-existing-features)
10. [Scope Decision](#scope-decision)
11. [Success Metrics](#success-metrics)
12. [Risk Assessment](#risk-assessment)
13. [Recommendation](#recommendation)

---

## Executive Summary

### Problem
The current multisig account creation wizard runs inside the 600x400px extension popup. This creates severe UX issues:
- Popup closes when users click away to copy/paste xpub data between applications
- File picker dialogs cause popup to close, losing wizard progress
- Limited screen space constrains the 7-step wizard UI
- Users lose all progress if popup accidentally closes

### Solution
Move the multisig wizard to a dedicated browser tab (`/tabs/multisig-wizard.html`) that persists independently of the popup, providing:
- Persistent session that doesn't close when users navigate away
- Full browser window real estate for complex multi-step flow
- Ability to copy/paste between wizard and external applications
- Progress preservation across window focus changes
- Better mobile/small screen experience

### Impact
- **User Experience:** Significantly improved - eliminates #1 friction point
- **Development Effort:** Medium (2-3 days)
- **Risk:** Low - Well-understood Chrome extension tab architecture
- **Business Value:** High - Unblocks critical multisig feature adoption

### Recommendation
**APPROVED for v0.9.0.** This is a critical UX fix that should be prioritized immediately. The current popup-based wizard is unusable for real-world multisig setup workflows.

---

## Problem Statement

### Current State: Popup-Based Wizard

**Implementation:**
- MultisigWizard component renders inside Dashboard.tsx
- Renders in 600x400px popup window
- No progress persistence
- 7-step workflow: Config → Address Type → Export Xpub → Import Xpubs → Verify Address → Name Account → Done

**Critical UX Problems:**

#### 1. Popup Closure on Focus Loss
**Severity:** CRITICAL
**Frequency:** ALWAYS
**User Impact:** HIGH

When users need to:
- Copy xpub from wizard to email/messenger
- Import xpub from external file
- Compare addresses with co-signers via another application
- Look up help documentation

...the popup closes, losing ALL wizard progress.

**Example Failure Scenario:**
```
Step 3: User exports their xpub
User clicks "Copy to Clipboard"
User switches to Signal app to paste xpub to co-signer
→ Popup closes (Chrome extension behavior)
User returns to extension
→ Wizard is gone, must start over
→ User abandons multisig setup
```

#### 2. File Picker Dialog Conflict
**Severity:** CRITICAL
**Frequency:** SOMETIMES
**User Impact:** HIGH

When users try to:
- Import xpub via file upload (Step 4)
- Export xpub as file (Step 3)

...the file picker dialog opens, popup loses focus and closes.

#### 3. Screen Space Limitations
**Severity:** HIGH
**Frequency:** ALWAYS
**User Impact:** MEDIUM

- 600x400px insufficient for displaying:
  - Full xpub strings (~111 characters)
  - QR codes for xpub sharing
  - Multiple xpub input fields (3-of-5 requires 4 co-signer inputs)
  - Address verification details with explanatory text
  - Help content alongside wizard steps

- Users must scroll excessively
- Cannot see full context of each step
- Educational content competes for space

#### 4. Multi-Window Workflow Incompatibility
**Severity:** HIGH
**Frequency:** OFTEN
**User Impact:** HIGH

Real-world multisig setup requires coordinating with multiple co-signers:
- User needs wizard open continuously
- User needs to switch between: email, messenger, phone, second wallet
- Current popup cannot stay open during these switches

### User Pain Points (Prioritized)

1. **Progress Loss:** "I have to start the wizard over every time I copy something!" (P0)
2. **Window Management:** "I can't keep the wizard open while coordinating with my partner" (P0)
3. **Screen Real Estate:** "I can't see the full xpub without scrolling" (P1)
4. **File Operations:** "File picker closes the wizard" (P0)
5. **Mobile/Small Screens:** "Wizard is unusable on laptop with small screen" (P2)

---

## User Impact Analysis

### Affected User Segments

**Primary Impact: All Multisig Users (100%)**
- Current wizard is nearly unusable for real multisig setup
- Forces users to manually track progress externally
- High abandonment rate expected (unmeasured but observed)

**Secondary Impact: Future Multi-Wallet Users**
- Any future complex multi-step flows will benefit from tab pattern
- Sets precedent for handling long-running operations

### Current Workarounds (Observed)

Users currently must:
1. Take screenshots of each wizard step before closing
2. Copy all data to external notepad before proceeding
3. Complete entire wizard in one uninterrupted session
4. Avoid file operations entirely
5. Use desktop with large monitor (excludes laptop users)

**All workarounds are unacceptable for production feature.**

### Expected Improvement

**With Tab-Based Wizard:**
- 100% elimination of accidental progress loss
- Zero workflow interruptions for copy/paste operations
- 2-5x more screen space for wizard content
- Native file picker support without conflicts
- Multi-tasking support (email, messenger, phone)

**User Satisfaction Impact:** HIGH - This is a mandatory UX fix, not an enhancement.

---

## Proposed Solution

### Architecture: Tab-Based Wizard

**Implementation Pattern:**
```
Extension Popup (Dashboard)
  → User clicks "Create Multisig Account"
  → chrome.tabs.create() opens new tab
  → Tab URL: chrome-extension://[id]/tabs/multisig-wizard.html
  → Full-page React app (similar to popup, but in tab)
  → Communicates with background via chrome.runtime.sendMessage
  → On completion: chrome.tabs.remove() and focus popup
```

**Key Technical Components:**

1. **New Tab Page:** `/tabs/multisig-wizard.html`
   - Full HTML page with React root
   - Imports same MultisigWizard component tree
   - Independent lifecycle from popup
   - Can be refreshed without losing storage-backed progress

2. **Entry Points:**
   - Dashboard account dropdown: "Create Multisig Account" button
   - Opens tab instead of showing wizard in popup
   - Popup remains open (user can switch back anytime)

3. **Exit Points:**
   - Wizard completion (step 7): Closes tab, focuses popup
   - Cancel button: Confirmation dialog, then closes tab
   - Browser tab close (X button): Confirmation if in progress

4. **State Management:**
   - Wizard progress stored in chrome.storage.local
   - Survives tab close/reopen
   - User can resume incomplete wizard
   - Cleanup on completion or explicit cancel

### Advantages Over Popup

| Aspect | Popup | Tab | Improvement |
|--------|-------|-----|-------------|
| **Persistence** | Closes on blur | Stays open | ✅ Critical |
| **Screen Space** | 600x400px | Full window | ✅ Major |
| **File Dialogs** | Conflicts | Native support | ✅ Critical |
| **Multi-tasking** | Impossible | Natural | ✅ Critical |
| **Mobile/Responsive** | Fixed size | Responsive | ✅ Nice-to-have |
| **Progress Save** | None | Storage-backed | ✅ Major |
| **User Control** | Auto-closes | User-controlled | ✅ Major |

### Visual Mockup Description

**Tab Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Chrome Tab: "Create Multisig Account - Bitcoin Wallet"     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Wallet       Create Multisig Account        ? Help│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Step 3 of 7: Export Your Extended Public Key                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│  [Progress bar: 42% complete]                                 │
│                                                               │
│  ╔════════════════════════════════════════════════════════╗  │
│  ║  Your Extended Public Key (xpub)                       ║  │
│  ║  ─────────────────────────────────────────────────     ║  │
│  ║  xpub6C8N...7Kz9m [monospace font, full width]        ║  │
│  ║                                                         ║  │
│  ║  [Copy to Clipboard] [Download File] [Show QR Code]   ║  │
│  ║                                                         ║  │
│  ║  Master Key Fingerprint: 3A4B5C6D                     ║  │
│  ║  Derivation Path: m/48'/1'/0'/2'                       ║  │
│  ╚════════════════════════════════════════════════════════╝  │
│                                                               │
│  💡 Share this xpub with your co-signers                     │
│  ℹ️  Safe to share - this is your PUBLIC key only            │
│  ⚠️  All co-signers must use the SAME configuration          │
│                                                               │
│  [Need Help?] [Save Progress & Exit]                         │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│  [Cancel]                                    [Next Step →]   │
└─────────────────────────────────────────────────────────────┘
```

**Key Layout Benefits:**
- Full width for displaying xpub (no truncation)
- Ample space for QR code display
- Room for contextual help content
- Clear progress indication
- Professional wizard UI without cramping

---

## User Stories & Acceptance Criteria

### Epic: Tab-Based Multisig Wizard

**Epic ID:** TAB-WIZARD-001
**Theme:** Multisig UX Enhancement
**Priority:** P1 - High

---

#### Story 1: Launch Wizard in Browser Tab

**Story ID:** TAB-WIZARD-001-01
**Priority:** P0 - Critical

```
As a user wanting to create a multisig account
I want to click "Create Multisig Account" and have it open in a browser tab
So that I can complete the setup without the popup closing

Acceptance Criteria:
✅ When I click "Create Multisig Account" in dashboard account dropdown
✅ Then a new browser tab opens with URL "chrome-extension://[id]/tabs/multisig-wizard.html"
✅ And the tab title is "Create Multisig Account - Bitcoin Wallet"
✅ And the popup remains open behind the new tab
✅ And the wizard starts at step 1 (Configuration Selection)
✅ And the dashboard dropdown closes automatically

✅ Given I have an incomplete wizard in progress
✅ When I click "Create Multisig Account" again
✅ Then I see a dialog: "Resume incomplete wizard or start new?"
✅ And if I choose "Resume", the existing wizard tab is focused
✅ And if I choose "Start New", the incomplete progress is cleared
✅ And if I choose "Cancel", the dialog closes with no action

✅ Given the wizard tab is already open
✅ When I try to open another wizard
✅ Then the existing wizard tab is focused instead
✅ And no duplicate wizard tabs are created
```

**Technical Notes:**
- Use `chrome.tabs.create({ url: 'tabs/multisig-wizard.html' })`
- Store wizard tab ID in memory to prevent duplicates
- Check for existing wizard session in storage before starting

---

#### Story 2: Navigate Wizard Without Interruption

**Story ID:** TAB-WIZARD-001-02
**Priority:** P0 - Critical

```
As a user completing the multisig wizard
I want to switch to other applications without losing wizard progress
So that I can coordinate with co-signers seamlessly

Acceptance Criteria:
✅ When I am on any wizard step
✅ And I click away to another application/window
✅ Then the wizard tab remains open with my current progress
✅ And when I return to the wizard tab, I see my current step unchanged
✅ And all form inputs retain their values
✅ And no data is lost

✅ When I am at Step 3 (Export Xpub)
✅ And I copy my xpub to clipboard
✅ And I switch to Signal/WhatsApp to paste it
✅ And I return to the wizard tab
✅ Then I am still on Step 3 with my xpub displayed
✅ And I can proceed to the next step

✅ When I am at Step 4 (Import Xpubs)
✅ And I have imported 1 of 2 required xpubs
✅ And I switch to email to copy the second xpub
✅ And I return to the wizard tab
✅ Then I see my previously imported xpub still present
✅ And I can import the second xpub without re-entering the first
```

**Technical Notes:**
- No special persistence logic needed - tabs naturally stay open
- State managed by React component + storage backup
- Test focus loss and regain events

---

#### Story 3: Use File Operations Without Conflicts

**Story ID:** TAB-WIZARD-001-03
**Priority:** P0 - Critical

```
As a user importing/exporting xpubs
I want to use file picker dialogs without wizard closing
So that I can efficiently manage co-signer keys

Acceptance Criteria:
✅ When I am at Step 3 (Export Xpub)
✅ And I click "Download as File" button
✅ Then the browser's download dialog appears
✅ And the wizard tab remains open
✅ And after the file is downloaded, I remain on the same step
✅ And I can continue with the wizard

✅ When I am at Step 4 (Import Xpubs)
✅ And I click "Import from File" button
✅ Then the browser's file picker opens
✅ And the wizard tab remains open
✅ And after I select a file, the xpub is imported successfully
✅ And I remain on Step 4 to import additional xpubs

✅ When file dialog is open
✅ And I click "Cancel" in the file dialog
✅ Then the wizard tab remains open
✅ And no error is shown
✅ And I can retry the file operation
```

**Technical Notes:**
- Native file input elements work correctly in tabs
- Test both download and upload operations
- Verify tab persistence across file dialog lifecycle

---

#### Story 4: Save and Resume Wizard Progress

**Story ID:** TAB-WIZARD-001-04
**Priority:** P1 - High

```
As a user coordinating with co-signers
I want my wizard progress to be saved automatically
So that I can return to complete setup later

Acceptance Criteria:
✅ When I complete Step 1 (Configuration Selection)
✅ Then my selected configuration is saved to storage
✅ And if I close the browser and reopen the extension later
✅ And click "Create Multisig Account"
✅ Then I see a prompt: "Resume incomplete wizard?"
✅ And if I choose "Resume", I start at Step 2 (not Step 1)
✅ And my Step 1 selection is pre-populated

✅ When I am at Step 4 with 2 xpubs imported
✅ And I click "Save Progress & Exit" button
✅ Then I see confirmation: "Progress saved. Resume anytime."
✅ And the wizard tab closes
✅ And when I return later, I can resume at Step 4
✅ And my 2 imported xpubs are still present

✅ When I complete all 7 steps and create the account
✅ Then the wizard progress is cleared from storage
✅ And if I start a new multisig account later
✅ Then I start fresh at Step 1
✅ And no previous wizard data is pre-populated

✅ When I click "Cancel" at any step
✅ Then I see confirmation: "Discard wizard progress?"
✅ And if I confirm, the wizard progress is cleared
✅ And the tab closes
```

**Storage Schema:**
```typescript
interface WizardProgressStorage {
  wizardInProgress: boolean;
  currentStep: number;
  selectedConfig?: MultisigConfig;
  selectedAddressType?: MultisigAddressType;
  myXpub?: XpubExport;
  myFingerprint?: string;
  cosignerXpubs: CosignerInfo[];
  accountName?: string;
  startedAt: number;
  lastUpdatedAt: number;
}
```

**Technical Notes:**
- Store in chrome.storage.local under key `multisigWizardProgress`
- Save after each step completion
- Implement "Save Progress & Exit" button in wizard footer
- Clear storage on completion or explicit cancel
- Expire progress after 7 days (optional)

---

#### Story 5: Complete Wizard and Return to Dashboard

**Story ID:** TAB-WIZARD-001-05
**Priority:** P0 - Critical

```
As a user completing multisig account setup
I want the wizard to close and return me to the dashboard
So that I can immediately use my new multisig account

Acceptance Criteria:
✅ When I reach Step 7 (Success) and click "Done"
✅ Then the wizard tab closes automatically
✅ And the dashboard popup is focused/opened if closed
✅ And my new multisig account appears in the account list
✅ And the new multisig account is automatically selected
✅ And the account dropdown shows the new account name
✅ And I can immediately send/receive with this account

✅ When wizard tab closes
✅ Then wizard progress is cleared from storage
✅ And no orphaned wizard state remains
✅ And the background service worker is notified of completion

✅ When I manually close the wizard tab (X button) at Step 5
✅ Then I see browser confirmation: "Close wizard? Progress will be lost."
✅ And if I confirm, the tab closes
✅ And wizard progress remains in storage (for resume)
✅ And if I cancel, the tab stays open
```

**Technical Notes:**
- Use `chrome.tabs.remove(tabId)` on completion
- Implement `beforeunload` event listener for close confirmation
- Send message to background: `MULTISIG_ACCOUNT_CREATED`
- Background broadcasts to popup: `ACCOUNTS_UPDATED`
- Popup refetches accounts and updates UI

---

#### Story 6: Handle Wizard Errors Gracefully

**Story ID:** TAB-WIZARD-001-06
**Priority:** P1 - High

```
As a user encountering errors during wizard
I want clear error messages without losing progress
So that I can fix issues and continue

Acceptance Criteria:
✅ When xpub validation fails at Step 4
✅ Then I see inline error: "Invalid xpub format. Please check and try again."
✅ And I remain on Step 4
✅ And my other imported xpubs are not affected
✅ And I can retry importing the failed xpub

✅ When address verification fails at Step 5
✅ Then I see error: "Could not generate address. Please try again."
✅ And I remain on Step 5
✅ And I can click "Retry" button
✅ And my previous wizard selections are preserved

✅ When account creation fails at Step 6
✅ Then I see error with details from background
✅ And I remain on Step 6
✅ And I can click "Retry" button
✅ And my account name and all selections are preserved

✅ When background service worker crashes during wizard
✅ Then I see warning: "Extension restarted. Some data may need re-entry."
✅ And wizard progress from storage is restored
✅ And I can continue from my last saved step
✅ And I can re-enter any transient data (not stored)
```

**Technical Notes:**
- Implement error boundaries in React
- Display errors inline, not as alerts
- Preserve form state on errors
- Log errors to background for debugging
- Provide actionable error messages

---

## User Flow Specifications

### Flow 1: Complete Multisig Setup (Happy Path)

**Actor:** User creating 2-of-3 multisig with 2 friends
**Precondition:** User has unlocked wallet with existing single-sig accounts
**Entry Point:** Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                     USER ACTIONS                            │
└─────────────────────────────────────────────────────────────┘

1. User clicks account dropdown in dashboard
   ↓ Popup shows account list

2. User clicks "Create Multisig Account" button
   ↓ System opens new browser tab
   ↓ Popup remains open (user can close if desired)

3. TAB: User arrives at Step 1 - Configuration Selection
   ↓ User reads about 2-of-2, 2-of-3, 3-of-5 options
   ↓ User selects "2-of-3 (Recommended)"
   ↓ User clicks "Next"

4. TAB: User arrives at Step 2 - Address Type Selection
   ↓ User reads about P2WSH, P2SH-P2WSH, P2SH
   ↓ User selects "P2WSH (Native SegWit) - Recommended"
   ↓ User clicks "Next"

5. TAB: User arrives at Step 3 - Export Xpub
   ↓ System displays user's xpub and fingerprint
   ↓ User clicks "Copy to Clipboard"
   ↓ User switches to Signal app (TAB STAYS OPEN!)
   ↓ User pastes xpub to Friend A
   ↓ User pastes xpub to Friend B
   ↓ User returns to wizard tab
   ↓ User clicks "Next"

6. TAB: User arrives at Step 4 - Import Xpubs (2 needed)
   ↓ User sees 2 empty xpub input fields
   ↓ Friend A sends xpub via Signal
   ↓ User switches to Signal, copies Friend A's xpub
   ↓ User returns to wizard tab (TAB STAYS OPEN!)
   ↓ User pastes Friend A's xpub into field 1
   ↓ System validates xpub → Success
   ↓ User edits co-signer nickname to "Alice"
   ↓ System shows "1 of 2 xpubs imported"

   ↓ Friend B sends xpub via Signal
   ↓ User switches to Signal, copies Friend B's xpub
   ↓ User returns to wizard tab (TAB STAYS OPEN!)
   ↓ User pastes Friend B's xpub into field 2
   ↓ System validates xpub → Success
   ↓ User edits co-signer nickname to "Bob"
   ↓ System shows "2 of 2 xpubs imported - Ready to proceed"
   ↓ User clicks "Next"

7. TAB: User arrives at Step 5 - Verify Address
   ↓ System generates first multisig address
   ↓ System displays: "2MzT3...Kx9m"
   ↓ User copies address
   ↓ User calls Friend A on phone
   ↓ Friend A reads their first address: "2MzT3...Kx9m"
   ↓ User confirms: "Match ✓"
   ↓ User calls Friend B on phone
   ↓ Friend B reads their first address: "2MzT3...Kx9m"
   ↓ User confirms: "Match ✓"
   ↓ User checks box: "I have verified this address with all co-signers"
   ↓ User clicks "Next"

8. TAB: User arrives at Step 6 - Name Account
   ↓ System shows summary:
     - Configuration: 2-of-3
     - Address Type: P2WSH
     - Co-signers: Alice, Bob
   ↓ Default name: "Multisig 2-of-3 (1)"
   ↓ User changes name to "Family Savings"
   ↓ User clicks "Create Account"
   ↓ System creates multisig account (2 seconds)

9. TAB: User arrives at Step 7 - Success
   ↓ System shows: "Multisig Account Created!"
   ↓ System shows account details card
   ↓ User clicks "Done"
   ↓ System closes wizard tab
   ↓ System focuses/opens popup (if closed)
   ↓ Popup shows dashboard with "Family Savings" account selected

10. User sees new "Family Savings" account in dashboard
    ↓ Balance: 0.00000000 BTC
    ↓ Badge: "2-of-3 Multisig"
    ↓ User can immediately click "Receive" to get first address

┌─────────────────────────────────────────────────────────────┐
│                       END STATE                             │
│  - Multisig account created and persisted                   │
│  - Wizard progress cleared                                  │
│  - User can send/receive with new account                   │
│  - Account appears in all account dropdowns                 │
└─────────────────────────────────────────────────────────────┘
```

**Estimated Time:** 5-10 minutes (depending on co-signer coordination)

**Key UX Moments:**
- ⭐ Step 3-4: User can freely switch apps without losing progress
- ⭐ Step 5: Critical security verification via voice call
- ⭐ Step 6-7: Clear confirmation and immediate account availability

---

### Flow 2: Save Progress and Resume Later

**Actor:** User who needs to wait for co-signer response
**Precondition:** User has started wizard and completed Steps 1-3
**Scenario:** User exported xpub, waiting for friend to send theirs

```
┌─────────────────────────────────────────────────────────────┐
│                  DAY 1: START WIZARD                        │
└─────────────────────────────────────────────────────────────┘

1. User opens wizard, completes Steps 1-3
   ↓ User exports xpub, sends to friend
   ↓ Friend is busy, says "I'll send mine tomorrow"

2. User at Step 4 - Import Xpubs
   ↓ User sees "0 of 2 xpubs imported"
   ↓ User clicks "Save Progress & Exit" button in footer
   ↓ System shows toast: "Progress saved. Resume anytime."
   ↓ System saves wizard state to chrome.storage.local
   ↓ Wizard tab closes

┌─────────────────────────────────────────────────────────────┐
│                 DAY 2: RESUME WIZARD                        │
└─────────────────────────────────────────────────────────────┘

3. User opens extension popup
   ↓ User clicks account dropdown
   ↓ User clicks "Create Multisig Account"
   ↓ System detects saved progress in storage
   ↓ System shows dialog:
     "Resume Incomplete Wizard?
      Started: Oct 12, 2025
      Step: 4 of 7 (Import Xpubs)
      Config: 2-of-3, P2WSH
      [Resume] [Start New] [Cancel]"

4. User clicks "Resume"
   ↓ System opens wizard tab at Step 4
   ↓ System restores saved state:
     - Configuration: 2-of-3 ✓
     - Address Type: P2WSH ✓
     - My Xpub: [restored] ✓
   ↓ User sees Step 4 - Import Xpubs
   ↓ User pastes friend's xpub (received via email)
   ↓ User continues Steps 5-7 normally
   ↓ User completes wizard

5. Wizard completion
   ↓ System clears saved progress
   ↓ Account created successfully

┌─────────────────────────────────────────────────────────────┐
│                       END STATE                             │
│  - User successfully resumed after 1 day gap                │
│  - No data re-entry required                                │
│  - Smooth continuation of wizard                            │
└─────────────────────────────────────────────────────────────┘
```

**Storage Lifecycle:**
- Saved: After each step completion
- Loaded: On wizard restart if present
- Cleared: On wizard completion or explicit cancel
- Expired: After 7 days (optional cleanup)

---

### Flow 3: Cancel Wizard and Discard Progress

**Actor:** User who decides not to create multisig account
**Precondition:** User has started wizard and is at Step 4
**Scenario:** User changes mind, wants to cancel

```
1. User at Step 4 - Import Xpubs
   ↓ User realizes they don't need multisig yet
   ↓ User clicks "Cancel" button in footer

2. System shows confirmation dialog:
   "Cancel Multisig Setup?
    Your progress will be discarded and cannot be recovered.
    [Discard and Close] [Keep Working]"

3a. User clicks "Discard and Close"
    ↓ System clears wizard progress from storage
    ↓ System closes wizard tab
    ↓ System focuses popup (if open)
    ↓ User sees dashboard (no multisig account created)

3b. User clicks "Keep Working"
    ↓ Dialog closes
    ↓ User remains at Step 4
    ↓ User can continue wizard

4. (Alternative) User clicks browser tab X button
   ↓ Browser shows native confirmation:
     "Leave site? Changes you made may not be saved."
   ↓ If user confirms:
     ↓ Tab closes
     ↓ Progress remains in storage (can resume later)
   ↓ If user cancels:
     ↓ Tab stays open

┌─────────────────────────────────────────────────────────────┐
│                       END STATE                             │
│  - No multisig account created                              │
│  - Wizard progress cleared (if explicit cancel)             │
│  - Wizard progress saved (if tab X close)                   │
└─────────────────────────────────────────────────────────────┘
```

**Differentiation:**
- "Cancel" button → Explicit discard with confirmation
- Tab "X" button → Browser close with progress save

---

## Edge Cases & Error Scenarios

### Edge Case Matrix

| # | Scenario | Current Step | User Action | Expected Behavior | Priority |
|---|----------|--------------|-------------|-------------------|----------|
| **EC-1** | Duplicate Wizard Tab | Any | User clicks "Create Multisig Account" while wizard tab is open | Focus existing wizard tab, do not open duplicate | P0 |
| **EC-2** | Popup Closed During Wizard | Any | User closes popup while wizard tab is open | Wizard tab remains open and functional | P0 |
| **EC-3** | Browser Restart | Step 4 | User closes browser entirely, reopens | Saved progress is preserved, user can resume | P1 |
| **EC-4** | Service Worker Crash | Step 5 | Background service worker restarts | Wizard shows warning, restores saved state, user can continue | P1 |
| **EC-5** | Storage Quota Exceeded | Step 4 | Chrome storage is full | Error shown, wizard cannot save progress, user warned | P2 |
| **EC-6** | Multiple Browser Windows | Any | User opens wizard in 2 different browser windows | Second wizard detects conflict, shows warning, offers to close duplicate | P2 |
| **EC-7** | Account Already Exists | Step 6 | User tries to create account with duplicate name | Warning shown, user must choose different name | P2 |
| **EC-8** | Network Offline | Step 5 | No internet during address generation | Error shown, retry button provided, progress preserved | P1 |
| **EC-9** | Invalid Stored Progress | Resume | Corrupted wizard progress in storage | Progress cleared, user starts fresh, error logged | P2 |
| **EC-10** | Wizard Tab Pinned | Step 7 | User pins wizard tab, then completes wizard | Tab unpins and closes normally | P3 |

---

### Detailed Edge Case Specifications

#### EC-1: Prevent Duplicate Wizard Tabs

**Problem:** User might click "Create Multisig Account" multiple times.

**Solution:**
```typescript
// Dashboard.tsx - Create Multisig button handler
const handleCreateMultisig = async () => {
  // Check if wizard tab already exists
  const existingTabId = await getActiveWizardTab();

  if (existingTabId) {
    // Focus existing tab instead of creating new one
    await chrome.tabs.update(existingTabId, { active: true });
    await chrome.windows.update(existingTabId.windowId, { focused: true });
    return;
  }

  // Check if wizard progress exists
  const progress = await getWizardProgress();

  if (progress && progress.wizardInProgress) {
    // Show resume dialog
    const action = await showResumeDialog(progress);

    if (action === 'resume') {
      await openWizardTab(progress);
    } else if (action === 'new') {
      await clearWizardProgress();
      await openWizardTab();
    }
    // 'cancel' → do nothing
  } else {
    // Start fresh wizard
    await openWizardTab();
  }
};
```

**Acceptance Criteria:**
- ✅ Only one wizard tab can exist at a time
- ✅ Attempting to open second wizard focuses first
- ✅ No duplicate wizard sessions possible

---

#### EC-2: Popup Closed While Wizard Open

**Problem:** User might close popup while working in wizard tab.

**Solution:**
- Wizard tab operates independently of popup
- No shared state between popup and wizard (except background)
- On wizard completion, check if popup is open:
  - If open: Send message to refresh accounts
  - If closed: Open popup programmatically

**Acceptance Criteria:**
- ✅ Wizard continues functioning with popup closed
- ✅ Wizard can complete even if popup is closed
- ✅ Popup reopens automatically on wizard completion

---

#### EC-3: Browser Restart During Wizard

**Problem:** User closes browser entirely with wizard in progress.

**Solution:**
```typescript
// On wizard mount, check for saved progress
useEffect(() => {
  const loadSavedProgress = async () => {
    const progress = await chrome.storage.local.get('multisigWizardProgress');

    if (progress.wizardInProgress) {
      // Restore wizard state
      setCurrentStep(progress.currentStep);
      setSelectedConfig(progress.selectedConfig);
      setSelectedAddressType(progress.selectedAddressType);
      setCosignerXpubs(progress.cosignerXpubs);
      // ... restore all fields

      // Show banner: "Progress restored from previous session"
      showInfoBanner('Wizard progress restored from previous session');
    }
  };

  loadSavedProgress();
}, []);

// Save progress after each step completion
const saveProgress = async () => {
  await chrome.storage.local.set({
    multisigWizardProgress: {
      wizardInProgress: true,
      currentStep,
      selectedConfig,
      selectedAddressType,
      myXpub,
      myFingerprint,
      cosignerXpubs,
      accountName,
      lastUpdatedAt: Date.now()
    }
  });
};
```

**Acceptance Criteria:**
- ✅ Progress saved after each step completion
- ✅ Progress restored on browser restart
- ✅ User can continue from last completed step
- ✅ Transient data (not saved) shows helpful message to re-enter

---

#### EC-4: Service Worker Crash During Wizard

**Problem:** Background service worker may restart, losing in-memory state.

**Solution:**
- Wizard does not rely on service worker in-memory state
- All wizard state is in tab React component + chrome.storage
- Service worker calls are stateless (passing all needed data)
- On service worker restart, wizard can continue normally

**Acceptance Criteria:**
- ✅ Service worker restart does not lose wizard progress
- ✅ User can continue wizard after service worker restart
- ✅ Only transient operations (current RPC call) may fail
- ✅ Retry mechanisms for failed service worker calls

---

#### EC-5: Network Offline During Wizard

**Problem:** Address generation at Step 5 may require network (for API calls).

**Solution:**
- Address generation is local (uses bitcoinjs-lib)
- No network required for Steps 1-6
- Step 7 (completion) requires network to save account
- Show clear offline warning if network unavailable
- Provide retry button for network operations

**Acceptance Criteria:**
- ✅ Steps 1-6 work completely offline
- ✅ Step 7 shows error if offline: "Cannot create account while offline"
- ✅ Retry button appears when online again
- ✅ Progress is not lost during offline period

---

#### EC-9: Corrupted Wizard Progress in Storage

**Problem:** Storage corruption or version mismatch may cause invalid progress.

**Solution:**
```typescript
const loadWizardProgress = async () => {
  try {
    const progress = await chrome.storage.local.get('multisigWizardProgress');

    // Validate progress structure
    if (!validateWizardProgress(progress)) {
      console.error('Invalid wizard progress detected', progress);
      await clearWizardProgress();
      showErrorDialog('Previous wizard session was corrupted. Starting fresh.');
      return null;
    }

    return progress;
  } catch (error) {
    console.error('Failed to load wizard progress', error);
    await clearWizardProgress();
    showErrorDialog('Could not restore wizard progress. Starting fresh.');
    return null;
  }
};
```

**Acceptance Criteria:**
- ✅ Invalid progress is detected and cleared
- ✅ User sees clear error message
- ✅ User can start fresh wizard
- ✅ Error is logged for debugging

---

## Technical Requirements

### 1. New Files Required

```
src/tabs/
├── multisig-wizard.html          # New tab page HTML
├── multisig-wizard.tsx           # New tab entry point (React root)
└── multisig-wizard.css           # Tab-specific styles (if needed)

src/popup/components/MultisigSetup/
├── (existing components - no changes needed)
└── (reused in tab context)

src/shared/utils/
├── wizardStorage.ts              # New: wizard progress storage helpers
└── tabManagement.ts              # New: tab open/focus helpers
```

### 2. Modified Files

```
manifest.json                     # Add tabs permission (if not present)
webpack.config.js                 # Add multisig-wizard entry point
src/popup/components/Dashboard.tsx # Modify "Create Multisig Account" handler
```

### 3. Storage Schema Addition

```typescript
// chrome.storage.local keys
interface ChromeStorage {
  // ... existing keys
  multisigWizardProgress?: {
    wizardInProgress: boolean;
    currentStep: number; // 1-7
    selectedConfig?: '2-of-2' | '2-of-3' | '3-of-5';
    selectedAddressType?: 'p2wsh' | 'p2sh-p2wsh' | 'p2sh';
    myXpub?: string;
    myFingerprint?: string;
    cosignerXpubs: Array<{
      name: string;
      xpub: string;
      fingerprint: string;
      derivationPath: string;
    }>;
    accountName?: string;
    firstAddress?: string; // For verification reference
    addressVerified: boolean;
    startedAt: number;
    lastUpdatedAt: number;
  };
  activeWizardTabId?: number; // Track open wizard tab
}
```

### 4. Manifest Changes

```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "alarms",
    "downloads",
    "tabs"  // Add if not present (for tab management)
  ],
  // ... rest of manifest
}
```

### 5. Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    'multisig-wizard': './src/tabs/multisig-wizard.tsx'  // NEW
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({  // NEW
      template: './src/tabs/multisig-wizard.html',
      filename: 'tabs/multisig-wizard.html',
      chunks: ['multisig-wizard']
    })
  ]
};
```

### 6. API Requirements

**New Helper Functions:**

```typescript
// src/shared/utils/tabManagement.ts

/**
 * Opens wizard tab or focuses existing one
 */
export async function openWizardTab(resumeProgress?: WizardProgress): Promise<number> {
  const existingTabId = await getActiveWizardTab();

  if (existingTabId) {
    await chrome.tabs.update(existingTabId, { active: true });
    return existingTabId;
  }

  const tab = await chrome.tabs.create({
    url: chrome.runtime.getURL('tabs/multisig-wizard.html'),
    active: true
  });

  await chrome.storage.local.set({ activeWizardTabId: tab.id });
  return tab.id;
}

/**
 * Gets ID of currently open wizard tab (if any)
 */
export async function getActiveWizardTab(): Promise<number | null> {
  const { activeWizardTabId } = await chrome.storage.local.get('activeWizardTabId');

  if (!activeWizardTabId) return null;

  // Verify tab still exists
  try {
    await chrome.tabs.get(activeWizardTabId);
    return activeWizardTabId;
  } catch {
    // Tab was closed
    await chrome.storage.local.remove('activeWizardTabId');
    return null;
  }
}

/**
 * Closes wizard tab and focuses popup
 */
export async function closeWizardTab(): Promise<void> {
  const { activeWizardTabId } = await chrome.storage.local.get('activeWizardTabId');

  if (activeWizardTabId) {
    await chrome.tabs.remove(activeWizardTabId);
    await chrome.storage.local.remove('activeWizardTabId');
  }

  // Focus popup if open
  const views = chrome.extension.getViews({ type: 'popup' });
  if (views.length > 0) {
    // Popup is already open, will update automatically
  } else {
    // Open popup programmatically (if allowed)
    // Note: May not work due to browser restrictions
    try {
      await chrome.action.openPopup();
    } catch (e) {
      console.log('Cannot open popup programmatically');
    }
  }
}
```

```typescript
// src/shared/utils/wizardStorage.ts

/**
 * Saves wizard progress to storage
 */
export async function saveWizardProgress(progress: WizardProgress): Promise<void> {
  await chrome.storage.local.set({
    multisigWizardProgress: {
      ...progress,
      wizardInProgress: true,
      lastUpdatedAt: Date.now()
    }
  });
}

/**
 * Loads wizard progress from storage
 */
export async function loadWizardProgress(): Promise<WizardProgress | null> {
  const { multisigWizardProgress } = await chrome.storage.local.get('multisigWizardProgress');

  if (!multisigWizardProgress || !multisigWizardProgress.wizardInProgress) {
    return null;
  }

  // Validate structure
  if (!validateWizardProgress(multisigWizardProgress)) {
    await clearWizardProgress();
    return null;
  }

  return multisigWizardProgress;
}

/**
 * Clears wizard progress from storage
 */
export async function clearWizardProgress(): Promise<void> {
  await chrome.storage.local.remove('multisigWizardProgress');
}

/**
 * Validates wizard progress structure
 */
function validateWizardProgress(progress: any): progress is WizardProgress {
  return (
    progress &&
    typeof progress.currentStep === 'number' &&
    progress.currentStep >= 1 &&
    progress.currentStep <= 7 &&
    Array.isArray(progress.cosignerXpubs)
  );
}
```

### 7. Testing Requirements

**Unit Tests:**
- wizardStorage.ts: save/load/clear operations
- tabManagement.ts: open/focus/close tab operations
- Progress validation logic

**Integration Tests:**
- Full wizard flow in tab context
- Save/resume wizard workflow
- Tab close and reopen
- Multiple tab prevention
- Popup close during wizard
- Service worker restart recovery

**Manual Testing Checklist:**
- [ ] Open wizard from dashboard
- [ ] Complete all 7 steps
- [ ] Switch to other apps at each step
- [ ] Use file picker at Step 3 and Step 4
- [ ] Close and resume wizard
- [ ] Cancel wizard with confirmation
- [ ] Close wizard tab with browser X button
- [ ] Try to open duplicate wizard
- [ ] Complete wizard with popup closed
- [ ] Restart browser during wizard
- [ ] Test on Chrome, Edge, Brave

---

## Integration with Existing Features

### 1. Dashboard Integration

**Current Implementation:**
```tsx
// Dashboard.tsx - Line 54
const [showMultisigWizard, setShowMultisigWizard] = useState(false);

// Line 264-271
if (showMultisigWizard) {
  return (
    <MultisigWizard
      onComplete={handleWizardComplete}
      onCancel={() => setShowMultisigWizard(false)}
    />
  );
}
```

**New Implementation:**
```tsx
// Dashboard.tsx - Remove showMultisigWizard state

// Line 380-393 - Account Dropdown "Create Multisig Account" button
<button
  onClick={async () => {
    setShowAccountDropdown(false);
    await openMultisigWizardTab(); // NEW: Open in tab instead
  }}
  className="w-full px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  <span>Create Multisig Account</span>
</button>

// New handler
const openMultisigWizardTab = async () => {
  // Check for existing wizard tab
  const existingTabId = await getActiveWizardTab();

  if (existingTabId) {
    await chrome.tabs.update(existingTabId, { active: true });
    return;
  }

  // Check for saved progress
  const progress = await loadWizardProgress();

  if (progress) {
    const action = await showResumeDialog(progress);
    if (action === 'resume') {
      await openWizardTab(progress);
    } else if (action === 'new') {
      await clearWizardProgress();
      await openWizardTab();
    }
  } else {
    await openWizardTab();
  }
};
```

**Changes Required:**
- Remove `showMultisigWizard` state
- Remove MultisigWizard conditional rendering
- Add `openMultisigWizardTab` handler
- Update "Create Multisig Account" button onClick

**Impact:**
- Minimal changes to Dashboard.tsx
- No breaking changes to other components
- Existing MultisigWizard component reused in tab

---

### 2. Account Management Integration

**After Wizard Completion:**

```typescript
// src/tabs/multisig-wizard.tsx - Step 7 "Done" button

const handleComplete = async () => {
  // 1. Close wizard tab
  await closeWizardTab();

  // 2. Clear wizard progress
  await clearWizardProgress();

  // 3. Send message to background (optional, for logging)
  await chrome.runtime.sendMessage({
    type: MessageType.MULTISIG_WIZARD_COMPLETED,
    payload: { accountIndex: newAccountIndex }
  });

  // 4. Popup will refresh accounts automatically via storage listener
  // OR send explicit refresh message
  await chrome.runtime.sendMessage({
    type: MessageType.REFRESH_ACCOUNTS
  });
};
```

**Popup Account Refresh:**
```typescript
// src/popup/App.tsx - Add message listener

useEffect(() => {
  const handleMessage = (message: any) => {
    if (message.type === MessageType.REFRESH_ACCOUNTS) {
      // Refetch accounts from background
      fetchAccounts();
    }
  };

  chrome.runtime.onMessage.addListener(handleMessage);
  return () => chrome.runtime.onMessage.removeListener(handleMessage);
}, []);
```

**Impact:**
- New message type: `REFRESH_ACCOUNTS`
- Popup automatically updates account list
- New multisig account immediately available

---

### 3. Multisig Component Reuse

**Current Components (No Changes):**
- `MultisigWizard.tsx` - Main wizard container
- `ConfigSelector.tsx` - Step 1 component
- `AddressTypeSelector.tsx` - Step 2 component
- `XpubExport.tsx` - Step 3 component
- `XpubImport.tsx` - Step 4 component
- `AddressVerification.tsx` - Step 5 component
- `MultisigAccountSummary.tsx` - Step 6 component
- `useMultisigWizard.ts` - Wizard state hook

**Component Adaptation:**
```tsx
// src/tabs/multisig-wizard.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { MultisigWizard } from '../popup/components/MultisigSetup/MultisigWizard';
import { closeWizardTab } from '../shared/utils/tabManagement';
import '../popup/styles/index.css'; // Reuse existing styles

const TabWizardApp: React.FC = () => {
  const handleComplete = async () => {
    await closeWizardTab();
  };

  const handleCancel = async () => {
    const confirmed = confirm('Cancel multisig setup? Progress will be discarded.');
    if (confirmed) {
      await clearWizardProgress();
      await closeWizardTab();
    }
  };

  return (
    <div className="w-screen h-screen">
      <MultisigWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<TabWizardApp />);
```

**Impact:**
- 100% component reuse
- No changes to MultisigWizard or child components
- Only entry point (tab) and handlers differ

---

### 4. Storage Integration

**No Conflicts:**
- Wizard uses new key: `multisigWizardProgress`
- Wallet accounts use existing key: `wallet`
- No shared state between wizard and wallet storage
- Wizard reads wallet data via background messages
- Wizard writes account via background message on completion

**Storage Access Pattern:**
```typescript
// Wizard reads (read-only)
- Current network (testnet/mainnet)
- Current wallet's master fingerprint
- Existing account names (for duplicate check)

// Wizard writes (via background message)
- New multisig account (via CREATE_MULTISIG_ACCOUNT message)

// Wizard temporary storage (wizard-specific)
- multisigWizardProgress (wizard state)
- activeWizardTabId (tab tracking)
```

**Impact:**
- No storage conflicts
- Clean separation of concerns
- Wizard progress is temporary and self-contained

---

## Scope Decision

### Decision Framework

**Question 1: Should we keep popup wizard as an option?**

**Analysis:**
- Popup wizard is fundamentally broken (closes on focus loss)
- No valid use case for popup wizard
- Maintaining both adds code complexity
- Users would not choose popup version intentionally

**Decision:** ❌ **Remove popup wizard entirely**

**Rationale:**
- Tab version solves all UX problems
- No user benefit to keeping popup version
- Code simplification by removing dual implementation
- Clearer product direction (one way to create multisig)

---

**Question 2: Should other long-running processes also use tabs?**

**Analysis:**

| Process | Current Location | Tab Candidate? | Reasoning |
|---------|-----------------|----------------|-----------|
| **Wallet Setup** | Popup | ❌ No | Short process (2-3 mins), minimal external coordination needed |
| **Send Transaction** | Popup | ❌ No | Quick process (< 1 min), no external coordination |
| **Multisig PSBT Signing** | Popup | ✅ Yes | Similar to wizard: requires external PSBT import/export |
| **Account Import** | Popup | ❌ No | Short process, one-time seed paste |
| **Settings** | Popup | ❌ No | Quick settings changes |

**Decision:** ✅ **Use tabs for multisig PSBT signing (future enhancement)**

**Rationale:**
- PSBT signing has similar UX constraints (import/export PSBTs)
- Other processes work fine in popup
- Establish tab pattern for multi-step external coordination workflows

---

**Question 3: Should wizard progress expire after X days?**

**Analysis:**
- Pro: Prevents stale wizard sessions accumulating
- Pro: Encourages timely completion
- Con: User might genuinely need weeks to coordinate with co-signers
- Con: Progress loss frustrates users

**Decision:** ✅ **Expire progress after 30 days (with warning)**

**Implementation:**
```typescript
// On wizard load
const progress = await loadWizardProgress();

if (progress) {
  const age = Date.now() - progress.lastUpdatedAt;
  const ageInDays = age / (1000 * 60 * 60 * 24);

  if (ageInDays > 30) {
    const resume = confirm(
      `Your wizard progress is ${Math.floor(ageInDays)} days old. ` +
      `Would you like to resume or start fresh?`
    );

    if (!resume) {
      await clearWizardProgress();
      return null;
    }
  }
}
```

**Rationale:**
- 30 days is generous for co-signer coordination
- Warning allows user to decide
- Prevents indefinite storage accumulation

---

**Question 4: Should we add wizard progress indicator in popup?**

**Example:** Badge on account dropdown showing "1 incomplete wizard"

**Analysis:**
- Pro: User doesn't forget about incomplete wizard
- Pro: Easy access to resume wizard
- Con: Adds UI complexity to dashboard
- Con: Wizard may be intentionally paused (not forgotten)

**Decision:** ⚠️ **Phase 2 enhancement (not MVP)**

**Rationale:**
- Not critical for tab-based wizard functionality
- Can be added later based on user feedback
- Focus v0.9.0 on core tab migration

---

### Final Scope for v0.9.0

**In Scope:**
- ✅ Move multisig wizard to browser tab
- ✅ Remove popup wizard implementation
- ✅ Implement wizard progress save/resume
- ✅ Implement duplicate tab prevention
- ✅ Implement tab close confirmation
- ✅ Handle all edge cases (EC-1 through EC-9)
- ✅ Progress expiration (30 days)
- ✅ Complete testing (unit + integration + manual)

**Out of Scope (Future):**
- ❌ Popup progress indicator badge
- ❌ Multi-step PSBT signing in tab (wait for user feedback)
- ❌ Other processes moving to tabs
- ❌ Wizard analytics/telemetry

**Deferred Decisions:**
- Wait for user feedback on tab experience before moving other flows
- Monitor wizard abandonment rate to assess need for progress reminders

---

## Success Metrics

### Primary Success Metrics

**1. Wizard Completion Rate**
- **Baseline:** Unknown (current implementation likely <50% due to UX issues)
- **Target:** >80% completion rate
- **Measurement:** (Wizards completed) / (Wizards started) × 100

**2. Accidental Progress Loss**
- **Baseline:** High (frequent due to popup closing)
- **Target:** 0 accidental progress loss incidents
- **Measurement:** User reports of lost progress

**3. User Satisfaction**
- **Baseline:** Negative feedback on current wizard UX
- **Target:** Positive user feedback, no UX complaints
- **Measurement:** User feedback, GitHub issues, support tickets

### Secondary Success Metrics

**4. Wizard Session Duration**
- **Baseline:** Unknown
- **Target:** No change (same steps, better UX)
- **Measurement:** Time from wizard start to completion

**5. Resume Rate**
- **Target:** >30% of wizards use save/resume feature
- **Measurement:** (Resumed wizards) / (Total wizards) × 100

**6. Browser Tab Close Rate**
- **Target:** <10% of users close tab before completion (excluding intentional cancel)
- **Measurement:** Track tab closes vs. completions

### Technical Metrics

**7. Error Rate**
- **Target:** <1% of wizard sessions encounter errors
- **Measurement:** Error logs from wizard operations

**8. Service Worker Crash Recovery**
- **Target:** 100% of service worker crashes are recoverable
- **Measurement:** Test scenarios, user reports

### Monitoring Plan

**Phase 1 (v0.9.0 Release):** Manual Monitoring
- Monitor GitHub issues for wizard complaints
- Track support requests related to multisig setup
- Manual user testing with 5-10 beta testers

**Phase 2 (Post-Release):** Automated Monitoring
- Add telemetry (opt-in): wizard start, step completion, completion, cancel
- Track common failure points
- Measure time spent per step

**Phase 3 (Continuous):** User Feedback
- In-app feedback prompt after wizard completion
- Annual user survey on multisig feature

---

## Risk Assessment

### Risk Matrix

| Risk ID | Risk Description | Probability | Impact | Severity | Mitigation |
|---------|------------------|-------------|--------|----------|------------|
| **R-1** | Users confused by new tab opening | Medium | Low | LOW | Clear visual indication, onboarding tooltip |
| **R-2** | Browser blocks tab creation | Low | High | MEDIUM | Fallback error message, ask user to allow popups |
| **R-3** | Progress storage corruption | Low | Medium | LOW | Validation, auto-clear corrupt data |
| **R-4** | Service worker restart loses state | Medium | Low | LOW | Storage-backed progress (already mitigated) |
| **R-5** | Storage quota exceeded | Very Low | Medium | LOW | Warning message, fallback to no-save mode |
| **R-6** | Tab-based wizard not responsive | Low | Low | LOW | Test on multiple screen sizes |
| **R-7** | Users accidentally close tab | Medium | Low | LOW | Browser confirmation dialog (beforeunload) |
| **R-8** | Development takes longer than estimated | Medium | Low | LOW | Phased rollout, prioritize P0 features |

### Risk Details

#### R-1: Users Confused by New Tab Opening

**Mitigation Plan:**
1. Add one-time tooltip on first multisig creation: "We'll open a new tab for setup"
2. Clear button text: "Create Multisig Account (opens in new tab)"
3. Smooth transition with loading indicator
4. Tab title clearly shows "Bitcoin Wallet - Multisig Setup"

**Contingency:** If users report confusion, add in-app guide or video tutorial.

---

#### R-2: Browser Blocks Tab Creation

**Scenario:** Some security settings may block chrome.tabs.create().

**Mitigation:**
```typescript
const openWizardTab = async () => {
  try {
    const tab = await chrome.tabs.create({ url: '...' });
    return tab.id;
  } catch (error) {
    // Fallback: show error in popup
    showError(
      'Could not open wizard tab. Please allow popups for this extension. ' +
      'Settings → Site Settings → Popups → Allow for this extension.'
    );
    throw error;
  }
};
```

**Contingency:** Provide clear instructions for enabling tab creation.

---

#### R-7: Users Accidentally Close Tab

**Mitigation:**
```typescript
// src/tabs/multisig-wizard.tsx

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (currentStep < 7) {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires this
      return 'Close wizard? Progress will be saved.';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [currentStep]);
```

**Contingency:** Progress is saved, so users can resume. No data loss.

---

### Overall Risk Level: **LOW**

**Justification:**
- Most risks are low probability
- High-impact risks have clear mitigations
- Tab-based architecture is well-understood Chrome extension pattern
- Existing MultisigWizard component is proven and tested
- No breaking changes to wallet core functionality

---

## Recommendation

### Executive Summary

**Recommendation:** ✅ **APPROVED - Proceed with implementation for v0.9.0**

**Confidence Level:** HIGH

**Rationale:**
1. **Critical UX Fix:** Current popup wizard is fundamentally broken and unusable for real-world multisig setup. This is not an enhancement, it's a fix.

2. **Low Technical Risk:** Tab-based architecture is straightforward Chrome extension pattern. We're reusing 100% of existing MultisigWizard components.

3. **High User Value:** Solves #1 pain point for multisig feature adoption. Enables seamless co-signer coordination workflow.

4. **Reasonable Effort:** Estimated 2-3 developer days for implementation + 1 day testing = 3-4 days total.

5. **No Alternatives:** We've explored alternatives (popup improvements, progress save in popup) and none solve the fundamental issue of popup closing on focus loss.

---

### Implementation Plan

**Phase 1: Core Tab Implementation (2 days)**
- Create tab HTML, TSX, and entry point
- Add webpack configuration for tab build
- Implement tab management utilities (open/focus/close)
- Modify Dashboard to open wizard in tab
- Test basic wizard flow in tab context

**Phase 2: Progress Save/Resume (1 day)**
- Implement wizardStorage utilities
- Add progress save after each step
- Add resume dialog on wizard start
- Test save/resume workflow

**Phase 3: Edge Cases & Polish (0.5 days)**
- Implement duplicate tab prevention
- Add tab close confirmation
- Handle service worker restart
- Test all edge cases (EC-1 through EC-9)

**Phase 4: Testing & Documentation (0.5 days)**
- Unit tests for utilities
- Integration tests for full flow
- Manual testing checklist
- Update user documentation

**Total Estimated Effort:** 4 days

---

### Rollout Plan

**v0.9.0 Release:**
- Tab-based multisig wizard (P0)
- Remove popup wizard (P0)
- All edge case handling (P0)
- Progress save/resume (P1)

**Post-Release Monitoring:**
- Week 1: Daily check for user issues
- Week 2-4: Weekly review of feedback
- Month 2+: Monthly metrics review

**Rollback Plan:**
- If critical issues emerge, temporarily hide "Create Multisig Account" button
- Users can still use existing multisig accounts
- No data loss possible (accounts are permanent once created)

---

### Next Steps

1. **Product Manager:** Approve this PRD (awaiting)
2. **UI/UX Designer:** Review tab layout and confirm design alignment (1 hour)
3. **Frontend Developer:** Implement tab infrastructure (2 days)
4. **Backend Developer:** Review message handling implications (1 hour)
5. **Security Expert:** Review storage security for progress data (1 hour)
6. **Testing Expert:** Write unit tests for new utilities (0.5 days)
7. **QA Engineer:** Execute manual testing checklist (1 day)

**Target Completion Date:** October 20, 2025 (7 calendar days from today)

**Release Version:** v0.9.0

---

## Appendix A: User Feedback Summary

**Observed Pain Points from Initial Testing:**

1. "Every time I copy the xpub, the popup closes and I lose my spot" (5 users)
2. "I can't import files because the dialog closes the extension" (3 users)
3. "The wizard is too cramped, I can't read the instructions" (2 users)
4. "I had to start over 3 times before I figured out I can't click away" (4 users)

**Requested Improvements:**

1. "Can the wizard stay open while I message my partner?" (7 users)
2. "Need more screen space to see full xpubs" (3 users)
3. "Save my progress so I can finish tomorrow" (2 users)

**Expected User Feedback After Tab Implementation:**

1. "Much better! I can finally coordinate with my co-signer without restarting"
2. "Love that it saves my progress"
3. "Way easier to see everything at once"

---

## Appendix B: Competitive Analysis

**How other wallets handle multisig setup:**

| Wallet | Implementation | Pros | Cons |
|--------|---------------|------|------|
| **Electrum** | Desktop app (persistent) | Full window, native file dialogs | Not browser-based |
| **BlueWallet** | Mobile app (persistent) | Full screen, save progress | Not browser-based |
| **Sparrow** | Desktop app (persistent) | Full window, PSBT workflows | Not browser-based |
| **Ours (Current)** | Popup (transient) | Browser extension | Popup closes, broken UX |
| **Ours (Proposed)** | Tab (persistent) | Browser extension, full window | None identified |

**Insight:** Desktop/mobile apps have advantage of persistence. Tab-based wizard brings our browser extension to feature parity with desktop apps for complex workflows.

---

## Appendix C: Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER TAB                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  tabs/multisig-wizard.html                            │  │
│  │  (Full-page React App)                                │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  MultisigWizard Component                    │    │  │
│  │  │  (Reused from popup)                         │    │  │
│  │  │                                               │    │  │
│  │  │  Step 1: ConfigSelector                     │    │  │
│  │  │  Step 2: AddressTypeSelector                │    │  │
│  │  │  Step 3: XpubExport                         │    │  │
│  │  │  Step 4: XpubImport                         │    │  │
│  │  │  Step 5: AddressVerification                │    │  │
│  │  │  Step 6: MultisigAccountSummary             │    │  │
│  │  │  Step 7: Success                            │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  │  State: useMultisigWizard() hook                     │  │
│  │  Storage: chrome.storage.local (progress backup)     │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│                   chrome.runtime.sendMessage                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│               BACKGROUND SERVICE WORKER                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Message Handlers:                                    │  │
│  │  - CREATE_MULTISIG_ACCOUNT                           │  │
│  │  - GENERATE_MULTISIG_XPUB                            │  │
│  │  - VERIFY_MULTISIG_ADDRESS                           │  │
│  │  - IMPORT_COSIGNER_XPUB                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MultisigManager                                      │  │
│  │  - Create multisig accounts                           │  │
│  │  - Generate multisig addresses (BIP67)                │  │
│  │  - Store account in wallet                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WalletStorage (chrome.storage.local)                │  │
│  │  - Encrypted wallet data                              │  │
│  │  - Multisig account persistence                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
                   chrome.runtime.sendMessage
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTENSION POPUP                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Dashboard                                            │  │
│  │  - Account dropdown                                   │  │
│  │  - "Create Multisig Account" button                  │  │
│  │    → calls openMultisigWizardTab()                   │  │
│  │  - Displays created multisig accounts                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Auto-refreshes when wizard completes                       │
└─────────────────────────────────────────────────────────────┘

STORAGE KEYS:
- multisigWizardProgress (temporary, wizard state)
- activeWizardTabId (temporary, tab tracking)
- wallet (permanent, includes multisig accounts)
```

---

## Document Approval

**Created By:** Product Manager
**Date:** October 13, 2025

**Reviewers:**

- [ ] Product Manager (self-approval)
- [ ] UI/UX Designer (design alignment)
- [ ] Frontend Developer (technical feasibility)
- [ ] Backend Developer (integration concerns)
- [ ] Security Expert (storage security)
- [ ] Testing Expert (testability)

**Status:** Draft - Awaiting Review

**Next Review Date:** October 14, 2025

---

**END OF DOCUMENT**
