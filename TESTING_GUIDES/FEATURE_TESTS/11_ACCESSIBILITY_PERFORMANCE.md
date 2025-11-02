# Feature Test Guide: Accessibility & Performance

**Feature Area:** Accessibility, Keyboard Navigation, & Performance
**Test Cases:** 12 tests
**Time to Execute:** 2 hours
**Priority:** P2 (Quality & Usability)

---

## Overview

This feature validates accessibility standards (WCAG AA compliance), keyboard navigation, screen reader compatibility, and performance metrics. Accessibility ensures the wallet is usable by everyone, including users with disabilities.

**Why this matters:** Accessibility is a legal requirement in many jurisdictions and ensures inclusivity. Performance impacts user experience and adoption.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Chrome DevTools open (F12) for all tests
- [ ] **Optional:** Screen reader (NVDA for Windows, VoiceOver for Mac)
- [ ] **Optional:** Color contrast checker tool
- [ ] **Take screenshots of any accessibility issues found**

---

## Test Cases

### A11Y-001: Keyboard Navigation - Tab Order

**Priority:** P1
**Time:** 15 minutes

**Purpose:** Verify all interactive elements accessible via keyboard

**Steps:**
1. Unlock wallet
2. Starting from first element, press Tab repeatedly
3. Observe focus moves through all interactive elements
4. Navigate entire Settings screen using Tab/Shift+Tab
5. Navigate Send screen using keyboard only
6. Attempt to complete a full task (e.g., send transaction) using ONLY keyboard

**Expected Results:**
- ✅ Tab moves focus to next interactive element
- ✅ Shift+Tab moves focus to previous element
- ✅ Tab order is logical (top to bottom, left to right)
- ✅ All buttons reachable via Tab
- ✅ All form fields reachable via Tab
- ✅ All links reachable via Tab
- ✅ No "keyboard traps" (can always Tab away)
- ✅ Current focus clearly visible (outline or highlight)
- ✅ Can complete entire workflow (create wallet, send, receive) via keyboard

**Tab Order Example (Send Screen):**
```
Tab Order:
1. Recipient Address field
2. Amount field
3. "Max" button
4. Fee: Slow button
5. Fee: Medium button
6. Fee: Fast button
7. "Preview Transaction" button
```

**Keyboard Trap Test:**
- Try to Tab away from every modal/dropdown
- Ensure Escape closes modals
- Verify no infinite Tab loops

**Screenshot Points:**
- Focus indicators on various elements

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-002: Keyboard Shortcuts - Enter/Space Activation

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify Enter and Space activate buttons correctly

**Steps:**
1. Tab to "Create Account" button
2. Press Enter
3. Observe button activates (modal opens)
4. Tab to "Cancel" button
5. Press Space
6. Observe button activates (modal closes)
7. Test on various button types: primary, secondary, danger

**Expected Results:**
- ✅ Enter activates focused button
- ✅ Space activates focused button
- ✅ Links activated by Enter only (not Space, by convention)
- ✅ Buttons activated by both Enter and Space
- ✅ No unexpected behavior

**Elements to Test:**
- [ ] "Create Wallet" button
- [ ] "Import Wallet" button
- [ ] "Send Transaction" button
- [ ] "Lock Wallet" button
- [ ] Dropdown select (arrow keys navigate)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-003: Keyboard Shortcuts - Escape to Close Modals

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify Escape key closes modals and dialogs

**Steps:**
1. Open transaction preview modal
2. Press Escape
3. Observe modal closes
4. Open account switcher dropdown
5. Press Escape
6. Observe dropdown closes
7. Test all modal types

**Expected Results:**
- ✅ Escape closes active modal
- ✅ Escape closes dropdowns
- ✅ Escape cancels forms (with confirmation if data entered)
- ✅ Focus returns to trigger element after Escape

**Modals to Test:**
- [ ] Transaction preview
- [ ] Seed phrase confirmation
- [ ] Account creation modal
- [ ] Error dialogs
- [ ] Confirmation prompts

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-004: Focus Indicators Visible

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify focus indicators are clearly visible

**Steps:**
1. Navigate entire application using Tab
2. Observe focus indicator on each element
3. Test on light and dark backgrounds
4. Verify contrast meets WCAG standards

**Expected Results:**
- ✅ Focus indicator visible on ALL interactive elements
- ✅ Indicator has sufficient contrast (3:1 minimum)
- ✅ Indicator style: outline, border, or glow
- ✅ Color: Distinct from element background
- ✅ Not removed by CSS (`outline: none` without alternative)
- ✅ Visible on buttons, links, form fields, checkboxes

**Visual Focus States:**
```
Button (no focus):
[Send Transaction]

Button (focused):
[Send Transaction]  ← 2px orange outline

Input (focused):
[________________]  ← 2px blue border
```

**Test on Dark Theme:**
- Focus indicators visible on dark backgrounds
- Sufficient contrast maintained

**Screenshot Points:**
- Focus indicators on various elements
- Focus on dark vs light backgrounds

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-005: Screen Reader - Form Labels

**Priority:** P1
**Time:** 15 minutes (if screen reader available)

**Prerequisites:** Screen reader installed (NVDA, VoiceOver, JAWS)

**Purpose:** Verify screen readers can read form labels and instructions

**Steps:**
1. Enable screen reader
2. Navigate to Send screen
3. Tab to "Recipient Address" field
4. Listen to screen reader announcement
5. Tab through all form fields
6. Verify screen reader announces labels correctly

**Expected Results:**
- ✅ Form fields have accessible labels
- ✅ Screen reader announces: "Recipient Address, edit text"
- ✅ Screen reader announces: "Amount in BTC, edit text"
- ✅ Required fields announced
- ✅ Error messages announced
- ✅ Help text announced
- ✅ Button purpose announced

**Screen Reader Announcements (Expected):**
```
"Recipient Address, required, edit text"
"Amount in BTC, edit text, 0.05 available"
"Medium fee button, selected"
"Preview Transaction button"
```

**If NO Screen Reader:**
- Inspect HTML for `<label>` tags
- Verify `aria-label` or `aria-labelledby` on inputs
- Check `role` attributes

**Screenshot Points:**
- HTML inspection showing labels

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-006: Screen Reader - Button Descriptions

**Priority:** P1
**Time:** 10 minutes (if screen reader available)

**Purpose:** Verify buttons have descriptive accessible names

**Steps:**
1. Enable screen reader
2. Tab to various buttons
3. Listen to screen reader announcements
4. Verify button purpose is clear

**Expected Results:**
- ✅ Icon-only buttons have `aria-label`
- ✅ Example: Lock icon button announced as "Lock Wallet"
- ✅ Example: Settings icon announced as "Settings"
- ✅ Example: Copy button announced as "Copy address to clipboard"
- ✅ Button state announced (pressed, expanded, etc.)

**Bad Examples (Should NOT hear):**
```
❌ "Button" (no description)
❌ "Icon" (no description)
❌ "Image" (no description)
```

**Good Examples (Should hear):**
```
✅ "Lock Wallet button"
✅ "Copy address to clipboard button"
✅ "Settings button"
✅ "Generate new address button"
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-007: Color Contrast - WCAG AA Compliance

**Priority:** P1
**Time:** 15 minutes

**Purpose:** Verify text has sufficient color contrast

**Tool:** Use Chrome DevTools Lighthouse or https://webaim.org/resources/contrastchecker/

**Steps:**
1. Open Chrome DevTools → Lighthouse
2. Run Accessibility audit
3. Check contrast ratio for:
   - Body text (gray-200 on gray-900)
   - Button text (white on orange)
   - Link text
   - Disabled state text
4. OR: Use contrast checker tool manually

**Expected Results:**
- ✅ Body text contrast: ≥ 4.5:1 (WCAG AA for normal text)
- ✅ Large text (18pt+): ≥ 3:1
- ✅ Button text: ≥ 4.5:1
- ✅ Link text: ≥ 4.5:1
- ✅ Error messages: ≥ 4.5:1 and not conveyed by color alone
- ✅ Disabled elements may have lower contrast (not required to meet standards)

**Test Combinations:**
```
Background       Text          Contrast  Result
─────────────────────────────────────────────────
#1A1A1A (gray-900) #E5E5E5 (gray-200)  12.6:1   ✅ PASS
#F7931A (orange)   #FFFFFF (white)     3.5:1    ⚠️ WARN (large text OK)
#22C55E (green)    #FFFFFF (white)     2.9:1    ❌ FAIL (too low)
```

**Use Lighthouse:**
1. F12 → Lighthouse tab
2. Select "Accessibility" category
3. Click "Generate report"
4. Review "Contrast" findings

**Screenshot Points:**
- Lighthouse accessibility score
- Contrast checker results

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-008: Error Messages Announced

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify error messages are accessible to screen readers

**Steps:**
1. Enter invalid address in Send screen
2. Observe error message
3. With screen reader: Verify error announced
4. Without screen reader: Check for `aria-live` or `role="alert"`

**Expected Results:**
- ✅ Error messages have `role="alert"` or `aria-live="polite"`
- ✅ Screen reader announces error immediately
- ✅ Error associated with correct field (`aria-describedby`)
- ✅ Error visible both visually and to screen readers
- ✅ Error not conveyed by color alone (has icon or text)

**Error Display Example:**
```html
<input
  id="recipient"
  aria-describedby="recipient-error"
  aria-invalid="true"
/>
<div id="recipient-error" role="alert">
  ⚠️ Invalid Bitcoin address
</div>
```

**Screen Reader Expected:**
"Invalid Bitcoin address, alert"

**Screenshot Points:**
- Error messages with icons

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### A11Y-009: Zoom to 200% - No Horizontal Scroll

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify layout works at 200% browser zoom (WCAG requirement)

**Steps:**
1. Open wallet
2. Press Ctrl+Plus (+) to zoom to 200%
3. Navigate entire application
4. Check for horizontal scrolling
5. Verify all content accessible

**Expected Results:**
- ✅ No horizontal scrollbar at 200% zoom
- ✅ Content reflows to fit
- ✅ Text remains readable
- ✅ No overlapping elements
- ✅ All functionality accessible
- ✅ Responsive design adapts

**Test Screens:**
- [ ] Dashboard
- [ ] Send screen
- [ ] Receive screen
- [ ] Settings
- [ ] Transaction history

**Screenshot Points:**
- Wallet at 200% zoom showing layout

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### PERF-001: Extension Load Time

**Priority:** P2
**Time:** 10 minutes

**Purpose:** Verify extension loads quickly

**Steps:**
1. Close wallet tab
2. Open Chrome Task Manager (Shift+Esc)
3. Note memory usage
4. Click extension icon
5. Measure time until wallet UI fully loaded
6. Repeat 3 times for average

**Expected Results:**
- ✅ Extension loads in < 1 second (cold start)
- ✅ Extension loads in < 500ms (warm start)
- ✅ UI interactive immediately
- ✅ No loading spinner >1 second

**Measurements:**
```
Trial 1: _____ ms
Trial 2: _____ ms
Trial 3: _____ ms
Average: _____ ms (should be < 1000ms)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### PERF-002: Balance Refresh Performance

**Priority:** P2
**Time:** 10 minutes

**Purpose:** Verify balance updates efficiently

**Steps:**
1. Unlock wallet
2. Note current balance
3. Open Chrome DevTools → Network tab
4. Trigger balance refresh (wait 30 seconds for auto-refresh OR click refresh if available)
5. Observe network requests
6. Measure time to update balance

**Expected Results:**
- ✅ Balance API call completes < 3 seconds
- ✅ Balance updates in UI < 500ms after API response
- ✅ Total refresh time < 4 seconds
- ✅ UI doesn't freeze during refresh
- ✅ Loading indicator shown (optional)

**Network Tab:**
- Request: GET /address/tb1qrp33g0q5c5txsp9arysrx...
- Response time: _____ ms

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### PERF-003: Memory Usage

**Priority:** P2
**Time:** 15 minutes

**Purpose:** Verify extension doesn't leak memory

**Steps:**
1. Open Chrome Task Manager (Shift+Esc)
2. Find "Bitcoin Wallet" extension
3. Note memory usage: _____ MB
4. Use wallet for 10 minutes (send, receive, switch accounts)
5. Check memory usage again: _____ MB
6. Lock and unlock wallet
7. Check memory usage: _____ MB

**Expected Results:**
- ✅ Initial memory: < 100 MB
- ✅ After 10 minutes: < 150 MB (reasonable growth)
- ✅ After lock/unlock: Memory released
- ✅ No continuous memory growth (leak)
- ✅ Memory stable over extended use

**Memory Log:**
```
Initial:     _____ MB
After 10 min: _____ MB (+____ MB)
After lock:   _____ MB
```

**If memory grows >200 MB:**
- Report as potential memory leak
- Include usage pattern that causes growth

**Screenshot Points:**
- Chrome Task Manager showing memory usage

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Edge Case Tests

### A11Y-EDGE-01: High Contrast Mode

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify wallet works with Windows High Contrast mode

**Prerequisites:** Windows OS with High Contrast mode available

**Steps:**
1. Enable Windows High Contrast mode
2. Open wallet
3. Navigate through screens
4. Verify usability

**Expected:**
- ✅ Wallet remains usable
- ✅ Text readable
- ✅ Buttons distinguishable
- ✅ Focus indicators visible

**Note:** May not be perfectly styled, but should be functional

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐) OR [ ] N/A (Not Windows)

---

### PERF-EDGE-01: Large Transaction History Performance

**Priority:** P2
**Time:** 10 minutes (if testable)

**Prerequisites:** Account with 50+ transactions

**Purpose:** Verify performance with large transaction history

**Steps:**
1. Navigate to transaction history
2. Scroll through all transactions
3. Observe performance

**Expected:**
- ✅ Smooth scrolling
- ✅ No lag or freezing
- ✅ Pagination or virtualization implemented
- ✅ Loads quickly even with 100+ transactions

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### PERF-EDGE-02: Multiple Accounts Performance

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify performance with many accounts

**Prerequisites:** Wallet with 10+ accounts

**Steps:**
1. Switch between accounts rapidly
2. Observe switching speed
3. Check Settings account list load time

**Expected:**
- ✅ Account switching < 500ms
- ✅ Account list loads < 1 second
- ✅ No UI freezing

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Test Summary

**Total Tests:** 9 accessibility + 3 performance + 3 edge cases = 15 tests
**P1 Tests:** 8 (A11Y-001 to A11Y-008)
**P2 Tests:** 7 (A11Y-009, PERF-001 to PERF-003, edges)

**Critical Accessibility Tests:**
- A11Y-001: Keyboard navigation
- A11Y-004: Focus indicators
- A11Y-007: Color contrast
- A11Y-008: Error announcements

**Critical Performance Tests:**
- PERF-001: Load time
- PERF-002: Balance refresh
- PERF-003: Memory usage

---

## Common Issues & Troubleshooting

### Issue: Cannot Tab to all elements
**Cause:** Elements not focusable or `tabindex` misconfigured
**Solution:** Add `tabindex="0"` to custom interactive elements
**Report As:** P1 accessibility bug

### Issue: Focus indicator not visible
**Cause:** CSS removes default outline without replacement
**Solution:** Add custom focus styles
**Report As:** P1 accessibility bug

### Issue: Color contrast too low
**Cause:** Color choices don't meet WCAG standards
**Solution:** Adjust colors or increase contrast
**Report As:** P1 accessibility bug

### Issue: Screen reader doesn't announce labels
**Cause:** Missing `<label>`, `aria-label`, or `aria-labelledby`
**Solution:** Add proper labels to all form fields
**Report As:** P1 accessibility bug

### Issue: Extension slow to load
**Cause:** Large bundle size or inefficient initialization
**Solution:** Optimize bundle, lazy load components
**Report As:** P2 performance bug

### Issue: Memory leak over time
**Cause:** Event listeners not cleaned up or references retained
**Solution:** Review component lifecycle, cleanup effects
**Report As:** P2 bug

---

## Filing Accessibility & Performance Bugs

**For accessibility bugs:**

1. **Gather Evidence:**
   - Screenshot showing issue (e.g., missing focus indicator)
   - Lighthouse accessibility report
   - Screen reader logs (if applicable)
   - WCAG guideline violated (e.g., "WCAG 2.1 AA 1.4.3 Contrast")

2. **File GitHub Issue:**
   - Title: "[A11Y] Brief description (Test A11Y-XXX)"
   - Include WCAG guideline reference
   - Attach screenshots and Lighthouse report
   - Tag with "accessibility" label

**Example:**
```
Title: [A11Y] Insufficient color contrast on error messages (Test A11Y-007) - WCAG 2.1 AA 1.4.3

Priority: P1
Test Case: A11Y-007

Description:
Error messages have insufficient color contrast, failing WCAG 2.1 AA standard.

WCAG Guideline Violated:
1.4.3 Contrast (Minimum) - Level AA

Details:
- Error text color: #FF6B6B (red)
- Background: #1A1A1A (dark gray)
- Contrast ratio: 3.2:1
- Required: 4.5:1 (for normal text)

Impact:
- Users with low vision cannot read error messages
- Violates accessibility standards
- Legal compliance issue in some jurisdictions

Recommended Fix:
- Use lighter red (#FF8A8A) for 4.6:1 contrast
- Add error icon (not relying on color alone)

Screenshot: [attached - showing Lighthouse contrast error]

Environment:
- Extension version: 0.10.0
- Test: Lighthouse accessibility audit
```

**For performance bugs:**

1. **Gather Metrics:**
   - Load times (with measurements)
   - Memory usage (before/after)
   - Chrome DevTools Performance trace
   - Network timing

2. **File GitHub Issue:**
   - Title: "[Performance] Brief description (Test PERF-XXX)"
   - Include specific measurements
   - Tag with "performance" label

---

## Accessibility Tools & Resources

**Testing Tools:**
- **Lighthouse:** Built into Chrome DevTools (F12 → Lighthouse)
- **axe DevTools:** Browser extension for accessibility testing
- **WAVE:** Web accessibility evaluation tool
- **Color Contrast Checker:** https://webaim.org/resources/contrastchecker/

**Screen Readers:**
- **NVDA (Windows):** Free, https://www.nvaccess.org/
- **VoiceOver (Mac):** Built-in (Cmd+F5)
- **JAWS (Windows):** Commercial, industry standard

**WCAG Resources:**
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM: https://webaim.org/

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for final review and sign-off.**
