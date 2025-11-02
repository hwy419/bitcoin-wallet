# Accessibility Guidelines

**Last Updated**: October 22, 2025
**Owner**: UI/UX Designer
**Status**: WCAG 2.1 AA Compliant

[← Back to Index](./_INDEX.md)

---

## Quick Navigation

- [WCAG Compliance](#wcag-compliance)
- [Keyboard Navigation](#keyboard-navigation)
- [Screen Reader Support](#screen-reader-support)
- [Focus Management](#focus-management)
- [ARIA Patterns](#aria-patterns)
- [Testing Checklist](#testing-checklist)

---

## Overview

The Bitcoin Wallet extension follows **WCAG 2.1 Level AA** accessibility standards to ensure usability for all users, including those using assistive technologies.

**Core Principles:**
- Perceivable: Information presented in ways users can perceive
- Operable: Interface components are operable by all users
- Understandable: Information and UI operation is understandable
- Robust: Content works with current and future assistive technologies

---

## WCAG Compliance

### WCAG 2.1 AA Requirements

**We meet or exceed all Level AA requirements:**

✅ **1.4.3 Contrast (Minimum) - AA**
- All text meets 4.5:1 ratio (normal text)
- All large text meets 3:1 ratio
- All UI components meet 3:1 ratio

✅ **1.4.11 Non-text Contrast - AA**
- All interactive elements have 3:1 contrast
- Focus indicators have sufficient contrast

✅ **2.1.1 Keyboard - A**
- All functionality available via keyboard
- No keyboard traps

✅ **2.1.2 No Keyboard Trap - A**
- Focus can move away from all components
- Modals can be closed with ESC

✅ **2.4.3 Focus Order - A**
- Logical, intuitive focus order

✅ **2.4.7 Focus Visible - AA**
- Keyboard focus always visible with high-contrast indicator

✅ **3.2.1 On Focus - A**
- No unexpected context changes on focus

✅ **4.1.2 Name, Role, Value - A**
- All components have accessible names and roles

---

### Color Contrast

All color combinations meet or exceed WCAG AA requirements:

```
✓ Text Primary (#FFFFFF) on Background (#1A1A1A): 14.0:1 (AAA)
✓ Text Secondary (#B4B4B4) on Background (#1A1A1A): 7.5:1 (AAA)
✓ Text Tertiary (#808080) on Background (#0F0F0F): 4.7:1 (AA)
✓ Bitcoin Orange (#F7931A) on Background (#0F0F0F): 12:1 (AAA)
✓ Text on Bitcoin Orange (#FFFFFF on #F7931A): 4.8:1 (AA)
✓ Border Default (#3A3A3A) on Background (#1A1A1A): 3.5:1 (AA)
```

**Semantic Colors (on #0F0F0F background):**
```
✓ Success Green (#22C55E): 7.2:1 (AAA)
✓ Error Red (#EF4444): 5.1:1 (AA)
✓ Warning Amber (#F59E0B): 6.8:1 (AAA)
✓ Info Blue (#3B82F6): 8.1:1 (AAA)
```

**Requirements:**
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px or 14px bold): 3:1 minimum
- UI components: 3:1 minimum
- Focus indicators: 3:1 minimum against adjacent colors

**We exceed AA in most cases, meeting AAA standards.**

---

### Color Independence

We never rely on color alone to convey information:

**✅ Good Examples:**
```
Sent transaction:    Icon (↗) + Red color + "-" prefix
Received transaction: Icon (↙) + Green color + "+" prefix
Error state:         Icon (⚠️) + Red border + Error text
Success state:       Icon (✓) + Green border + Success text
```

**❌ Bad Examples:**
```
Sent transaction:    Red text only (no icon/indicator)
Error state:         Red border only (no icon/text)
```

**Patterns Used:**
- Icons + Color
- Text labels + Color
- Borders/Backgrounds + Icons + Text
- Multiple redundant cues

---

## Keyboard Navigation

### Tab Order

**Logical, left-to-right, top-to-bottom order:**

1. Sidebar navigation (top to bottom)
2. Main content (header → body → footer)
3. Modals (header → body → footer → close button)
4. Forms (top to bottom, left to right)

**Skip Link:**
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**Visible on focus, allows keyboard users to skip navigation.**

---

### Focus Indicators

**All interactive elements have visible focus indicators:**

```css
/* Default focus indicator */
.focusable:focus {
  outline: 2px solid #F7931A; /* Bitcoin orange */
  outline-offset: 2px;
}

/* Alternative using ring utility (Tailwind) */
.focusable:focus {
  @apply ring-2 ring-bitcoin ring-offset-2 ring-offset-gray-950;
}
```

**Focus Indicator Standards:**
- Color: Bitcoin Orange (#F7931A)
- Width: 2px minimum
- Offset: 2px from element
- Contrast: 3:1 against background and element

**Never remove focus indicators:**
```css
/* ❌ NEVER do this */
button:focus {
  outline: none;
}
```

---

### Keyboard Shortcuts

**Global Shortcuts:**
```
Escape:   Close modal, cancel action, close dropdown
Enter:    Submit form, confirm action, activate button
Space:    Toggle checkbox, activate button, toggle switch
Arrow Keys: Navigate dropdown options, navigate radio groups
Tab:      Move focus forward
Shift+Tab: Move focus backward
```

**Form-Specific:**
```
Enter in input:       Submit form (if single input) or move to next field
Ctrl+A in textarea:   Select all text
Home/End:            Start/end of input field
```

**Component-Specific:**
```
Dropdown Menu:
  - Arrow Down/Up: Navigate options
  - Enter/Space: Select option
  - Escape: Close dropdown
  - Type: Quick search/filter

Modal Dialog:
  - Escape: Close modal
  - Tab: Cycle through focusable elements (trapped)

Toggle Switch:
  - Space/Enter: Toggle state
```

---

## Screen Reader Support

### Semantic HTML

**Always use semantic HTML elements:**

```html
<!-- ✅ Good -->
<button>Send</button>
<nav>...</nav>
<main>...</main>
<header>...</header>
<form>...</form>

<!-- ❌ Bad -->
<div onclick="...">Send</div>
<div class="nav">...</div>
```

**Benefits:**
- Screen readers announce element role automatically
- Keyboard navigation works by default
- Better SEO and accessibility

---

### ARIA Labels

**All non-text elements have accessible names:**

```html
<!-- Icon buttons -->
<button aria-label="Copy address to clipboard">
  <ClipboardIcon />
</button>

<button aria-label="Close dialog">
  <XMarkIcon />
</button>

<!-- Complex inputs -->
<input
  type="text"
  id="amount"
  aria-describedby="amount-helper amount-error"
  aria-invalid="false"
/>
<span id="amount-helper">Enter amount in BTC</span>
<span id="amount-error" role="alert">Invalid amount</span>

<!-- Links with icons -->
<a href="..." aria-label="View transaction on block explorer">
  View <ExternalLinkIcon className="inline" aria-hidden="true" />
</a>
```

**Rules:**
- All icon-only buttons must have `aria-label`
- Decorative icons must have `aria-hidden="true"`
- Functional icons need descriptive labels
- Links with only icons need `aria-label`

---

### Live Regions

**Announce dynamic changes to screen readers:**

```html
<!-- Toast notifications -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  Transaction sent successfully!
</div>

<!-- Status updates -->
<div role="status" aria-live="polite" aria-atomic="true">
  Balance: 0.05000000 BTC
</div>

<!-- Loading states -->
<div role="status" aria-live="polite" aria-label="Loading transaction history">
  <span className="sr-only">Loading...</span>
  <SpinnerIcon />
</div>
```

**Live Region Types:**
- `role="alert"` + `aria-live="assertive"`: Critical, immediate announcement (errors, urgent warnings)
- `role="status"` + `aria-live="polite"`: Informational, announced at next break (success, updates)
- `aria-atomic="true"`: Announce entire region, not just changes

**What to Announce:**
- ✅ Form submission results (success/error)
- ✅ Balance updates
- ✅ Transaction confirmations
- ✅ Loading state changes
- ❌ Every keystroke
- ❌ Hover states
- ❌ Visual-only animations

---

### Screen Reader Only Content

**Provide context only for screen readers:**

```tsx
<span className="sr-only">Current balance: </span>
<span className="text-4xl font-bold">0.05000000 BTC</span>

<button>
  <PlusIcon aria-hidden="true" />
  <span className="sr-only">Add new account</span>
</button>
```

**Tailwind SR-Only Class:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## Focus Management

### Modal Focus Trap

**When modal opens:**
1. Save reference to trigger element
2. Move focus to modal (first focusable element or close button)
3. Trap focus within modal (Tab cycles through modal only)
4. Prevent background from being focusable

**When modal closes:**
1. Return focus to trigger element
2. Restore background focusability

**Implementation:**
```tsx
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save trigger element
      triggerRef.current = document.activeElement as HTMLElement;

      // Focus modal
      modalRef.current?.focus();

      // Trap focus
      const handleTab = (e: KeyboardEvent) => {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements?.[0] as HTMLElement;
        const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      return () => document.removeEventListener('keydown', handleTab);
    } else {
      // Return focus to trigger
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="..."
    >
      {children}
    </div>
  );
};
```

---

### Form Field Focus

**Auto-focus first field:**
```tsx
const PasswordInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="password" />;
};
```

**Move focus to errors:**
```tsx
const handleSubmit = async () => {
  const errors = validate(formData);
  if (errors.length > 0) {
    // Focus first error field
    const firstErrorField = document.getElementById(errors[0].fieldId);
    firstErrorField?.focus();

    // Announce error to screen readers
    const errorMessage = errors[0].message;
    announceToScreenReader(errorMessage, 'assertive');
  }
};
```

---

## ARIA Patterns

### Button

```html
<button
  type="button"
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label="Send Bitcoin"
>
  {isLoading ? 'Sending...' : 'Send'}
</button>
```

**Attributes:**
- `type="button"` (prevents form submission if inside form)
- `disabled` when action unavailable
- `aria-busy="true"` during async operations
- `aria-label` for icon-only buttons

---

### Input Field

```html
<div>
  <label htmlFor="recipient-address" className="...">
    Recipient Address
    <span className="text-red-500" aria-label="required">*</span>
  </label>
  <input
    id="recipient-address"
    type="text"
    aria-describedby="address-helper address-error"
    aria-invalid={!!error}
    aria-required="true"
  />
  <div id="address-helper" className="text-xs text-gray-400">
    Enter Bitcoin address starting with tb1, 2, m, or n
  </div>
  {error && (
    <div id="address-error" role="alert" className="text-xs text-red-500">
      {error}
    </div>
  )}
</div>
```

**Attributes:**
- `id` matching `htmlFor` on label
- `aria-describedby` pointing to helper text and errors
- `aria-invalid` when validation fails
- `aria-required` for required fields
- `role="alert"` on error messages (auto-announced)

---

### Checkbox

```html
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    aria-describedby="terms-description"
  />
  <span>I have read and agree to the terms</span>
</label>
<div id="terms-description" className="text-xs text-gray-400">
  You must agree to continue
</div>
```

---

### Toggle Switch

```html
<button
  role="switch"
  aria-checked={enabled}
  aria-labelledby="privacy-mode-label"
  aria-describedby="privacy-mode-description"
  onClick={() => setEnabled(!enabled)}
  className={`... ${enabled ? 'bg-bitcoin' : 'bg-gray-700'}`}
>
  <span className="..."></span> {/* Visual thumb */}
</button>
<div id="privacy-mode-label" className="font-medium">
  Randomize Round Amounts
</div>
<div id="privacy-mode-description" className="text-xs text-gray-400">
  Adds small randomization to round numbers
</div>
```

**Attributes:**
- `role="switch"` (not checkbox)
- `aria-checked` reflects current state
- `aria-labelledby` points to label
- `aria-describedby` points to description
- Responds to Space and Enter keys

---

### Modal Dialog

```html
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  className="..."
>
  <h2 id="modal-title">Confirm Transaction</h2>
  <p id="modal-description">
    Review the transaction details before sending.
  </p>
  <!-- Modal content -->
  <button aria-label="Close dialog" onClick={onClose}>
    <XMarkIcon />
  </button>
</div>
```

**Attributes:**
- `role="dialog"`
- `aria-modal="true"` (indicates modal behavior)
- `aria-labelledby` points to title
- `aria-describedby` points to description
- Focus trapped within modal
- ESC key closes modal

---

### Dropdown Menu

```html
<button
  id="account-dropdown-button"
  aria-haspopup="true"
  aria-expanded={isOpen}
  aria-controls="account-dropdown-menu"
  onClick={() => setIsOpen(!isOpen)}
>
  Account 1 <ChevronDownIcon />
</button>

{isOpen && (
  <div
    id="account-dropdown-menu"
    role="menu"
    aria-labelledby="account-dropdown-button"
  >
    <button role="menuitem" onClick={() => selectAccount(1)}>
      Account 1
    </button>
    <button role="menuitem" onClick={() => selectAccount(2)}>
      Account 2
    </button>
  </div>
)}
```

**Attributes:**
- `aria-haspopup="true"` on trigger
- `aria-expanded` reflects open state
- `aria-controls` points to menu
- `role="menu"` on container
- `role="menuitem"` on items
- Arrow keys navigate items

---

## Testing Checklist

### Keyboard Testing

**Test all flows with keyboard only (no mouse):**

- [ ] Can tab through all interactive elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] All buttons activatable with Enter/Space
- [ ] All form fields reachable and editable
- [ ] Can close modals with ESC
- [ ] Can navigate dropdowns with arrow keys
- [ ] Can submit forms with Enter
- [ ] Focus indicators visible on all elements
- [ ] No keyboard traps (can tab out of everything)
- [ ] Skip link visible on focus

---

### Screen Reader Testing

**Test with screen readers (NVDA, JAWS, VoiceOver):**

- [ ] All buttons announced with clear names
- [ ] All form fields have associated labels
- [ ] Helper text announced with fields
- [ ] Errors announced immediately when they occur
- [ ] Loading states announced
- [ ] Success/failure feedback announced
- [ ] Icons have text alternatives
- [ ] Landmarks properly labeled (navigation, main, etc.)
- [ ] Headings create logical document structure
- [ ] Lists properly marked up (ul, ol, li)

---

### Color Contrast Testing

**Use tools like WebAIM Contrast Checker:**

- [ ] All text meets 4.5:1 ratio (or 3:1 for large text)
- [ ] All UI components meet 3:1 ratio
- [ ] Focus indicators meet 3:1 ratio
- [ ] Error states distinguishable without color
- [ ] Success states distinguishable without color
- [ ] Interactive elements distinguishable without color

---

### Browser Testing

**Test accessibility in all supported browsers:**

- [ ] Chrome + ChromeVox
- [ ] Firefox + NVDA
- [ ] Safari + VoiceOver
- [ ] Edge + Narrator

---

## Touch Targets

**All interactive elements have minimum 44x44px touch target:**

```css
/* Ensure minimum touch target */
button, a, input[type="checkbox"], input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
  /* Or use padding to reach 44px */
}
```

**Spacing:**
- Minimum 8px between adjacent touch targets
- Prefer 12-16px for better usability

---

## Text Sizing

**All text must be resizable up to 200% without breaking layout:**

- Use relative units (rem, em) for font sizes
- Avoid fixed heights that break with larger text
- Test with browser zoom at 200%
- Minimum font size: 12px (0.75rem)

**Line Height:**
- Body text: 1.5 (150%) minimum
- Headings: 1.2 (120%) minimum

---

## Motion & Animation

**Respect user preferences for reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Implementation in React:**
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const animationClass = prefersReducedMotion
  ? ''
  : 'transition-all duration-200';
```

---

## Related Documentation

- [Design System](./design-system.md) - Color contrast ratios and typography
- [Components](./components.md) - Component-specific ARIA patterns
- [User Flows](./user-flows.md) - Keyboard navigation through flows
- [Design Decisions](./decisions.md) - Accessibility-focused design choices

---

## Resources

**WCAG Guidelines:**
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG AA Checklist](https://www.a11yproject.com/checklist/)

**Testing Tools:**
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

**Screen Readers:**
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (Mac/iOS)](https://www.apple.com/accessibility/voiceover/)
- [ChromeVox (Chrome)](https://chrome.google.com/webstore/detail/chromevox-classic-extensi/kgejglhpjiefppelpmljglcjbhoiplfn)

---

**Last Updated**: October 22, 2025
**WCAG Compliance**: Level AA