# Send & Receive Modal Visual Layering Fix - Design Specification

**Document Type:** Design Specification
**Created:** October 20, 2025
**Author:** UI/UX Designer
**Status:** Ready for Implementation
**Related Files:**
- `src/tab/components/modals/SendModal.tsx`
- `src/tab/components/modals/ReceiveModal.tsx`
- `src/tab/components/SendScreen.tsx`
- `src/tab/components/ReceiveScreen.tsx`

---

## Table of Contents

1. [Problem Analysis](#1-problem-analysis)
2. [Design System Context](#2-design-system-context)
3. [Recommended Solution](#3-recommended-solution)
4. [Visual Specifications](#4-visual-specifications)
5. [Component Structure](#5-component-structure)
6. [Implementation Guide](#6-implementation-guide)
7. [Testing Checklist](#7-testing-checklist)

---

## 1. Problem Analysis

### 1.1 Current Visual Issues

The Send and Receive modals display unwanted black borders/margins inside the modal frames due to conflicting layering:

**Issue Visualization:**
```
┌─────────────────────────────────────────┐
│ Modal Backdrop (bg-black/70)            │
│  ┌───────────────────────────────────┐  │
│  │ Modal Container (bg-gray-900)     │  │
│  │ + padding p-6                     │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ Screen Component            │  │  │
│  │  │ (bg-gray-950) ← BLACK SHOWS │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │ Internal Content      │  │  │  │
│  │  │  │ (bg-gray-850)         │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Root Cause:**
The SendScreen and ReceiveScreen components were originally designed as full-page tab views, not modal content. They include:

1. **Full dark background** (`bg-gray-950`) intended for full-page contexts
2. **Complete header sections** with back buttons (redundant with modal close button)
3. **Internal padding** that conflicts with modal padding
4. **Height specifications** (`h-full`) designed for full viewport

When wrapped in modals with their own padding (`p-6`), the screen component's `bg-gray-950` background shows through as unwanted black borders between the modal container and the content.

### 1.2 Affected Components

**SendScreen.tsx (Lines 490-807):**
- Line 491: `<div className="w-full h-full bg-gray-950 flex flex-col">`
- Lines 492-509: Header with back button and account info
- Lines 512-807: Content wrapped in `bg-gray-850` cards

**ReceiveScreen.tsx (Lines 59-204):**
- Line 60: `<div className="w-full h-full bg-gray-950 flex flex-col">`
- Lines 62-78: Header with back button and account info
- Lines 81-203: Content wrapped in `bg-gray-850` cards

**Modal Wrappers:**
- Line 98 (both modals): `bg-gray-900 rounded-2xl` container
- Line 113 (both modals): `<div className="p-6">` wrapping screen components

### 1.3 Design System Conflict

**Existing Modal Pattern (from AddEditContactModal, Modal component):**
- Modal container: `bg-gray-900` with `border border-gray-700`
- Modal provides own padding
- Content flows directly without intermediate backgrounds
- Single visual hierarchy level

**Current Screen Pattern (full-page view):**
- Outer wrapper: `bg-gray-950` (deep black for full viewport)
- Header bar: `bg-gray-900 border-b border-gray-800`
- Content cards: `bg-gray-850 border border-gray-700`

**Why It Breaks:**
When modal padding meets screen background, the `bg-gray-950` creates visible black gaps that don't match the established modal design pattern.

---

## 2. Design System Context

### 2.1 Existing Modal Patterns

**Modal Component (`src/tab/components/shared/Modal.tsx`):**
```tsx
// Line 86-87
<div className={`bg-gray-900 border border-gray-700 rounded-xl
                 shadow-2xl max-h-[90vh] overflow-y-auto ${className}`}>
  {children}
</div>
```

**AddEditContactModal Pattern:**
- Uses `<Modal>` wrapper with `className="max-w-2xl w-full"`
- Content wrapped in `<div className="p-6">`
- Form elements flow directly without intermediate backgrounds
- Consistent `bg-gray-900` background throughout

**SendModal & ReceiveModal (Current):**
```tsx
// Lines 89-100
<div className="fixed inset-0 z-50 overflow-y-auto">
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                    w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* Close button */}
      <div className="p-6">
        <SendScreen ... />
      </div>
    </div>
  </div>
</div>
```

### 2.2 Color Palette Reference

**Background Layers (from darkest to lightest):**
- `bg-gray-950`: #030712 (Nearly black - full-page backgrounds)
- `bg-gray-900`: #111827 (Dark gray - modal containers, headers)
- `bg-gray-850`: #1A1A1A (Custom - content cards, elevated surfaces)
- `bg-gray-800`: #1F2937 (Medium gray - buttons, secondary surfaces)
- `bg-gray-700`: #374151 (Light gray - borders)

**Border Colors:**
- `border-gray-800`: #1F2937 (Header separators)
- `border-gray-700`: #374151 (Standard borders)

**Text Colors:**
- `text-white`: #FFFFFF (Headings, primary text)
- `text-gray-300`: #D1D5DB (Body text, labels)
- `text-gray-400`: #9CA3AF (Secondary text)
- `text-gray-500`: #6B7280 (Tertiary text, placeholders)
- `text-gray-600`: #4B5563 (Muted text)

### 2.3 Spacing Standards

**Modal Specifications:**
- Outer padding: `p-4` (16px viewport margin)
- Content padding: `p-6` (24px)
- Section spacing: `mb-6` (24px between major sections)
- Element spacing: `mb-4` (16px between related elements)
- Tight spacing: `mb-2`, `mb-3` (8px-12px for form labels, small gaps)

---

## 3. Recommended Solution

### 3.1 Solution: Conditional Rendering with `isModal` Prop

**Approach:** Modify existing SendScreen and ReceiveScreen components to accept an optional `isModal` prop that conditionally renders different visual structures.

**Rationale:**
1. **Code Reuse:** Maintains single source of truth for business logic
2. **Minimal Changes:** Only visual/structural adjustments, no logic duplication
3. **Maintainability:** One component to update for future changes
4. **Type Safety:** TypeScript ensures prop consistency
5. **Flexibility:** Components work in both tab and modal contexts

**Alternative Rejected:** Creating separate `SendModalContent` and `ReceiveModalContent` components would duplicate logic for:
- Form state management
- Contact integration
- Validation
- API calls
- PSBT handling
- Fee estimation

This duplication creates maintenance burden and potential for bugs.

### 3.2 Implementation Strategy

**Phase 1: Update Screen Components**
1. Add optional `isModal?: boolean` prop to both components
2. Conditionally render outer wrapper (remove `bg-gray-950` in modal mode)
3. Conditionally render header section (hide in modal mode - modal has its own header)
4. Adjust padding and spacing for modal context

**Phase 2: Update Modal Wrappers**
1. Remove redundant `p-6` padding wrapper
2. Pass `isModal={true}` prop to screen components
3. Add modal title to modal container (replacing screen header)

**Phase 3: Preserve Tab View**
1. Ensure tab-based routing continues to work without `isModal` prop
2. Full-page view maintains existing appearance

---

## 4. Visual Specifications

### 4.1 Modal Mode Visual Hierarchy

**Correct Layering:**
```
┌─────────────────────────────────────────────────────┐
│ Modal Backdrop (bg-black/70 backdrop-blur-sm)       │
│  ┌───────────────────────────────────────────────┐  │
│  │ Modal Container (bg-gray-900, rounded-2xl)    │  │
│  │                                               │  │
│  │ ┌─ Close Button (top-right) ───────────────┐ │  │
│  │                                               │  │
│  │ ┌─────────────────────────────────────────┐  │  │
│  │ │ Modal Title Section (p-6 pb-4)          │  │  │
│  │ │ - "Send Bitcoin" / "Receive Bitcoin"    │  │  │
│  │ │ - Account name subtitle                 │  │  │
│  │ └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │ ┌─────────────────────────────────────────┐  │  │
│  │ │ Content Section (px-6 pb-6)             │  │  │
│  │ │                                         │  │  │
│  │ │ ┌────────────────────────────────────┐ │  │  │
│  │ │ │ Content Cards (bg-gray-850)        │ │  │  │
│  │ │ │ - Form fields                      │ │  │  │
│  │ │ │ - QR code                          │ │  │  │
│  │ │ │ - Buttons                          │ │  │  │
│  │ │ └────────────────────────────────────┘ │  │  │
│  │ │                                         │  │  │
│  │ └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4.2 Component-Specific Specifications

#### 4.2.1 Send Modal

**Modal Title Section:**
```tsx
<div className="px-6 pt-6 pb-4">
  <h1 className="text-xl font-bold text-white">Send Bitcoin</h1>
  <p className="text-sm text-gray-500 mt-1">{account.name}</p>
</div>
```

**Content Section:**
```tsx
<div className="px-6 pb-6 space-y-6">
  {/* Multisig info box (if applicable) */}
  {/* Error message */}
  {/* Recipient address field */}
  {/* Amount field */}
  {/* Fee selection */}
  {/* Transaction summary */}
  {/* Send button */}
  {/* Balance info */}
</div>
```

**Visual Specifications:**
- Modal width: `max-w-2xl` (672px)
- Modal max-height: `max-h-[90vh]` (90% viewport height)
- Content overflow: `overflow-y-auto` on modal container
- Padding: `px-6` horizontal, `pt-6 pb-6` vertical
- Title spacing: `pb-4` (creates 16px gap to content)
- Content cards maintain: `bg-gray-850 border border-gray-700 rounded-xl`

**Success View (Modal Mode):**
```tsx
<div className="px-6 pb-6">
  <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
    {/* Success icon */}
    {/* Transaction details */}
    {/* Transaction ID */}
    {/* View on explorer link */}
    {/* Done button */}
  </div>
</div>
```

#### 4.2.2 Receive Modal

**Modal Title Section:**
```tsx
<div className="px-6 pt-6 pb-4">
  <h1 className="text-xl font-bold text-white">Receive Bitcoin</h1>
  <p className="text-sm text-gray-500 mt-1">{account.name}</p>
</div>
```

**Content Section:**
```tsx
<div className="px-6 pb-6 space-y-6">
  {/* Multisig badge and info (if applicable) */}
  {/* QR code card */}
  {/* All receiving addresses card (if multiple) */}
</div>
```

**Visual Specifications:**
- Modal width: `max-w-2xl` (672px)
- Modal max-height: `max-h-[90vh]`
- Padding: `px-6` horizontal, `pt-6 pb-6` vertical
- QR code card: `bg-gray-850 border border-gray-700 rounded-xl p-6`
- Address list card: `bg-gray-850 border border-gray-700 rounded-xl p-6`

### 4.3 Tab Mode Visual Hierarchy (Unchanged)

**Full-Page Layering:**
```
┌─────────────────────────────────────────────────────┐
│ Tab Container (bg-gray-950 - full viewport)         │
│  ┌───────────────────────────────────────────────┐  │
│  │ Header (bg-gray-900, border-b border-gray-800) │ │
│  │ - Back button                                  │ │
│  │ - Title & account name                         │ │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Content (p-6)                                  │  │
│  │ ┌────────────────────────────────────────────┐ │ │
│  │ │ Content Cards (bg-gray-850)                │ │ │
│  │ └────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**No Changes Required:** Tab mode continues to use existing structure with full backgrounds and headers.

---

## 5. Component Structure

### 5.1 SendScreen Component Structure

**Updated Props Interface:**
```typescript
interface SendScreenProps {
  account: WalletAccount;
  balance: Balance;
  onBack: () => void;
  onSendSuccess: () => void;
  isModal?: boolean; // NEW: Optional prop for modal context
}
```

**Component Structure (Main View):**
```tsx
const SendScreen: React.FC<SendScreenProps> = ({
  account,
  balance,
  onBack,
  onSendSuccess,
  isModal = false // Default to false for backward compatibility
}) => {
  // ... existing state and logic ...

  // Send form view
  return (
    <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
      {/* Header - Only render in tab mode */}
      {!isModal && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="..." title="Back">
              {/* Back icon */}
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Send Bitcoin</h1>
              <p className="text-sm text-gray-500">{account.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
        <div className={isModal ? "" : "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6"}>
          {/* Multisig Info Box */}
          {isMultisigAccount && (
            <div className={`flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg ${isModal ? "" : "mb-6"}`}>
              {/* ... existing content ... */}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`p-3 bg-red-500/15 border border-red-500/30 rounded-lg ${isModal ? "" : "mb-4"}`}>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Form Fields */}
          {/* ... existing form content ... */}
        </div>
      </div>

      {/* Modals (unlock, PSBT export, xpub picker) remain unchanged */}
    </div>
  );
};
```

**Success View Structure:**
```tsx
if (txid) {
  return (
    <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
      {/* Header - Only in tab mode */}
      {!isModal && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <h1 className="text-xl font-bold text-white">Transaction Sent!</h1>
        </div>
      )}

      {/* Success Content */}
      <div className={isModal ? "" : "flex-1 overflow-y-auto p-6"}>
        <div className={isModal ?
          "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6" :
          "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6"
        }>
          {/* Success icon, details, buttons */}
        </div>
      </div>
    </div>
  );
}
```

### 5.2 ReceiveScreen Component Structure

**Updated Props Interface:**
```typescript
interface ReceiveScreenProps {
  account: WalletAccount;
  onBack: () => void;
  isModal?: boolean; // NEW
}
```

**Component Structure:**
```tsx
const ReceiveScreen: React.FC<ReceiveScreenProps> = ({
  account,
  onBack,
  isModal = false
}) => {
  // ... existing state and logic ...

  return (
    <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
      {/* Header - Only in tab mode */}
      {!isModal && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="..." title="Back">
              {/* Back icon */}
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Receive Bitcoin</h1>
              <p className="text-sm text-gray-500">{account.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
        {!currentAddress ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No receiving address available</p>
          </div>
        ) : (
          <>
            {/* Multisig badge and info */}
            {isMultisigAccount && (
              <div className={isModal ? "mb-6" : ""}>
                {/* ... existing multisig content ... */}
              </div>
            )}

            {/* QR Code Section */}
            <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
              {/* ... existing QR code content ... */}
            </div>

            {/* All Receiving Addresses */}
            {receivingAddresses.length > 1 && (
              <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
                {/* ... existing address list ... */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
```

### 5.3 Modal Wrapper Updates

#### SendModal.tsx

**Current Structure (Lines 79-126):**
```tsx
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 ..." onClick={onClose} />

    {/* Modal */}
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose} className="absolute top-4 right-4 ...">
            {/* X icon */}
          </button>

          {/* Send Screen Content */}
          <div className="p-6">
            <SendScreen ... />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

**Updated Structure:**
```tsx
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
         onClick={onClose} aria-hidden="true" />

    {/* Modal */}
    <div className="fixed inset-0 z-50 overflow-y-auto"
         role="dialog" aria-modal="true" aria-labelledby="send-modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white
                             transition-colors z-10"
                  aria-label="Close send modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Title - NEW */}
          <div className="px-6 pt-6 pb-4">
            <h1 id="send-modal-title" className="text-xl font-bold text-white">
              Send Bitcoin
            </h1>
            <p className="text-sm text-gray-500 mt-1">{account.name}</p>
          </div>

          {/* Send Screen Content - UPDATED */}
          <div className="px-6 pb-6">
            <SendScreen
              account={account}
              balance={balance}
              onBack={onClose}
              onSendSuccess={() => {
                onSendSuccess();
                onClose();
              }}
              isModal={true} // NEW PROP
            />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

#### ReceiveModal.tsx

**Updated Structure (Same pattern):**
```tsx
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
         onClick={onClose} aria-hidden="true" />

    {/* Modal */}
    <div className="fixed inset-0 z-50 overflow-y-auto"
         role="dialog" aria-modal="true" aria-labelledby="receive-modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white
                             transition-colors z-10"
                  aria-label="Close receive modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Title - NEW */}
          <div className="px-6 pt-6 pb-4">
            <h1 id="receive-modal-title" className="text-xl font-bold text-white">
              Receive Bitcoin
            </h1>
            <p className="text-sm text-gray-500 mt-1">{account.name}</p>
          </div>

          {/* Receive Screen Content - UPDATED */}
          <div className="px-6 pb-6">
            <ReceiveScreen
              account={account}
              onBack={onClose}
              onAccountsUpdate={onAccountsUpdate}
              allAccounts={allAccounts}
              isModal={true} // NEW PROP
            />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

---

## 6. Implementation Guide

### 6.1 Step-by-Step Implementation

#### Step 1: Update SendScreen Component

**File:** `src/tab/components/SendScreen.tsx`

**Changes:**

1. **Update Props Interface (Line 10-15):**
```typescript
interface SendScreenProps {
  account: WalletAccount;
  balance: Balance;
  onBack: () => void;
  onSendSuccess: () => void;
  isModal?: boolean; // Add this line
}
```

2. **Update Component Signature (Line 19):**
```typescript
const SendScreen: React.FC<SendScreenProps> = ({
  account,
  balance,
  onBack,
  onSendSuccess,
  isModal = false // Add this parameter with default
}) => {
```

3. **Update Success View Outer Wrapper (Line 385-486):**

**Replace:**
```typescript
return (
  <div className="w-full h-full bg-gray-950 flex flex-col">
    {/* Header */}
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <h1 className="text-xl font-bold text-white">Transaction Sent!</h1>
    </div>

    {/* Success Content */}
    <div className="flex-1 overflow-y-auto p-6">
      <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
        {/* ... content ... */}
      </div>
    </div>
  </div>
);
```

**With:**
```typescript
return (
  <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
    {/* Header - Only in tab mode */}
    {!isModal && (
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white">Transaction Sent!</h1>
      </div>
    )}

    {/* Success Content */}
    <div className={isModal ? "" : "flex-1 overflow-y-auto p-6"}>
      <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
        {/* ... existing content unchanged ... */}
      </div>
    </div>
  </div>
);
```

4. **Update Main Form View Outer Wrapper (Line 490-491):**

**Replace:**
```typescript
return (
  <div className="w-full h-full bg-gray-950 flex flex-col">
```

**With:**
```typescript
return (
  <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
```

5. **Update Header Section (Lines 492-509):**

**Replace:**
```typescript
{/* Header */}
<div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
  <div className="flex items-center">
    <button onClick={onBack} className="..." title="Back">
      {/* ... */}
    </button>
    <div>
      <h1 className="text-xl font-bold text-white">Send Bitcoin</h1>
      <p className="text-sm text-gray-500">{account.name}</p>
    </div>
  </div>
</div>
```

**With:**
```typescript
{/* Header - Only render in tab mode */}
{!isModal && (
  <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
    <div className="flex items-center">
      <button onClick={onBack} className="mr-4 p-1 text-gray-400 hover:text-white transition-colors" title="Back">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 className="text-xl font-bold text-white">Send Bitcoin</h1>
        <p className="text-sm text-gray-500">{account.name}</p>
      </div>
    </div>
  </div>
)}
```

6. **Update Main Content Section (Lines 511-807):**

**Replace:**
```typescript
{/* Main Content */}
<div className="flex-1 overflow-y-auto p-6">
  <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
    {/* Multisig Info Box */}
    {isMultisigAccount && (
      <div className="mb-6 flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        {/* ... */}
      </div>
    )}

    {/* Error Message */}
    {error && (
      <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
        {/* ... */}
      </div>
    )}

    {/* All form fields ... */}
  </div>
</div>
```

**With:**
```typescript
{/* Main Content */}
<div className={isModal ? "" : "flex-1 overflow-y-auto p-6"}>
  {/* Only wrap in card if NOT in modal mode */}
  {isModal ? (
    <>
      {/* Multisig Info Box */}
      {isMultisigAccount && (
        <div className="mb-6 flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <span className="text-2xl flex-shrink-0">ℹ️</span>
          <div>
            <p className="font-semibold text-sm text-blue-400 mb-1">Multisig Transaction Flow</p>
            <p className="text-xs text-blue-400/80">
              This is a multisig account. After creating the transaction, you'll receive a PSBT (Partially
              Signed Bitcoin Transaction) to share with your co-signers for signature collection.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* All form fields WITHOUT extra card wrapper */}
      {/* Recipient Address */}
      <div className="mb-6">
        {/* ... existing field content ... */}
      </div>

      {/* Amount */}
      <div className="mb-6">
        {/* ... existing field content ... */}
      </div>

      {/* Fee Selection */}
      <div className="mb-6">
        {/* ... existing field content ... */}
      </div>

      {/* Transaction Summary */}
      {amount && !amountError && !addressError && (
        <div className="mb-6 bg-gray-900 rounded-lg p-4">
          {/* ... existing content ... */}
        </div>
      )}

      {/* Send Button */}
      <button onClick={handleSend} disabled={/* ... */} className="...">
        {/* ... existing content ... */}
      </button>

      {/* Balance Info */}
      <div className="mt-4 text-center">
        {/* ... existing content ... */}
      </div>
    </>
  ) : (
    <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
      {/* EXISTING CONTENT - NO CHANGES */}
      {/* ... all existing form content stays exactly as is ... */}
    </div>
  )}
</div>
```

**IMPORTANT:** This is the most complex change. You're essentially removing one level of wrapping in modal mode while preserving it in tab mode.

#### Step 2: Update ReceiveScreen Component

**File:** `src/tab/components/ReceiveScreen.tsx`

**Changes:**

1. **Update Props Interface (Line 7-10):**
```typescript
interface ReceiveScreenProps {
  account: WalletAccount;
  onBack: () => void;
  isModal?: boolean; // Add this line
}
```

2. **Update Component Signature (Line 12):**
```typescript
const ReceiveScreen: React.FC<ReceiveScreenProps> = ({
  account,
  onBack,
  isModal = false // Add this parameter with default
}) => {
```

3. **Update Outer Wrapper (Line 59-60):**

**Replace:**
```typescript
return (
  <div className="w-full h-full bg-gray-950 flex flex-col">
```

**With:**
```typescript
return (
  <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
```

4. **Update Header Section (Lines 61-78):**

**Replace:**
```typescript
{/* Header */}
<div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
  <div className="flex items-center">
    <button onClick={onBack} className="..." title="Back">
      {/* ... */}
    </button>
    <div>
      <h1 className="text-xl font-bold text-white">Receive Bitcoin</h1>
      <p className="text-sm text-gray-500">{account.name}</p>
    </div>
  </div>
</div>
```

**With:**
```typescript
{/* Header - Only render in tab mode */}
{!isModal && (
  <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
    <div className="flex items-center">
      <button onClick={onBack}
              className="mr-4 p-1 text-gray-400 hover:text-white transition-colors"
              title="Back">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 className="text-xl font-bold text-white">Receive Bitcoin</h1>
        <p className="text-sm text-gray-500">{account.name}</p>
      </div>
    </div>
  </div>
)}
```

5. **Update Main Content Section (Lines 80-203):**

**Replace:**
```typescript
{/* Main Content */}
<div className="flex-1 overflow-y-auto p-6">
```

**With:**
```typescript
{/* Main Content */}
<div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
```

**Note:** The content inside (QR code cards, address list) can stay as-is since they already use proper card styling.

#### Step 3: Update SendModal Component

**File:** `src/tab/components/modals/SendModal.tsx`

**Changes:**

1. **Update Modal Structure (Lines 79-126):**

**Replace:**
```typescript
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
         onClick={onClose} aria-hidden="true" />

    {/* Modal */}
    <div ref={modalRef} className="fixed inset-0 z-50 overflow-y-auto"
         role="dialog" aria-modal="true" aria-labelledby="send-modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white
                             transition-colors z-10"
                  aria-label="Close send modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Send Screen Content */}
          <div className="p-6">
            <SendScreen
              account={account}
              balance={balance}
              onBack={onClose}
              onSendSuccess={() => {
                onSendSuccess();
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

**With:**
```typescript
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
         onClick={onClose} aria-hidden="true" />

    {/* Modal */}
    <div ref={modalRef} className="fixed inset-0 z-50 overflow-y-auto"
         role="dialog" aria-modal="true" aria-labelledby="send-modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white
                             transition-colors z-10"
                  aria-label="Close send modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Title - NEW SECTION */}
          <div className="px-6 pt-6 pb-4">
            <h1 id="send-modal-title" className="text-xl font-bold text-white">
              Send Bitcoin
            </h1>
            <p className="text-sm text-gray-500 mt-1">{account.name}</p>
          </div>

          {/* Send Screen Content - UPDATED */}
          <div className="px-6 pb-6">
            <SendScreen
              account={account}
              balance={balance}
              onBack={onClose}
              onSendSuccess={() => {
                onSendSuccess();
                onClose();
              }}
              isModal={true} // NEW PROP
            />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

#### Step 4: Update ReceiveModal Component

**File:** `src/tab/components/modals/ReceiveModal.tsx`

**Changes:**

1. **Update Modal Structure (Lines 79-126):**

**Replace:**
```typescript
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
         onClick={onClose} aria-hidden="true" />

    {/* Modal */}
    <div ref={modalRef} className="fixed inset-0 z-50 overflow-y-auto"
         role="dialog" aria-modal="true" aria-labelledid="receive-modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white
                             transition-colors z-10"
                  aria-label="Close receive modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Receive Screen Content */}
          <div className="p-6">
            <ReceiveScreen
              account={account}
              onBack={onClose}
              onAccountsUpdate={onAccountsUpdate}
              allAccounts={allAccounts}
            />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

**With:**
```typescript
return (
  <>
    {/* Backdrop */}
    <div className="fixed inset-0 bg-black/70 z-50 transition-opacity duration-300"
         onClick={onClose} aria-hidden="true" />

    {/* Modal */}
    <div ref={modalRef} className="fixed inset-0 z-50 overflow-y-auto"
         role="dialog" aria-modal="true" aria-labelledby="receive-modal-title">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl
                        w-full max-w-2xl max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}>
          {/* Close button */}
          <button onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white
                             transition-colors z-10"
                  aria-label="Close receive modal">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Modal Title - NEW SECTION */}
          <div className="px-6 pt-6 pb-4">
            <h1 id="receive-modal-title" className="text-xl font-bold text-white">
              Receive Bitcoin
            </h1>
            <p className="text-sm text-gray-500 mt-1">{account.name}</p>
          </div>

          {/* Receive Screen Content - UPDATED */}
          <div className="px-6 pb-6">
            <ReceiveScreen
              account={account}
              onBack={onClose}
              onAccountsUpdate={onAccountsUpdate}
              allAccounts={allAccounts}
              isModal={true} // NEW PROP
            />
          </div>
        </div>
      </div>
    </div>
  </>
);
```

### 6.2 Critical Implementation Notes

**TypeScript Strictness:**
- The `isModal` prop MUST be optional (`isModal?: boolean`)
- Default value MUST be `false` to maintain backward compatibility
- Tab-based routing does NOT pass this prop, so it defaults to full-page mode

**Conditional Rendering Pattern:**
```typescript
// Good - Clean ternary
className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}

// Good - Conditional block
{!isModal && (
  <div>Header content</div>
)}

// Good - Different content per mode
{isModal ? (
  <div>Modal content structure</div>
) : (
  <div className="...">Tab content structure</div>
)}
```

**Spacing Adjustments:**
- Modal mode: Remove `mb-6` from first element (modal title provides spacing)
- Modal mode: Use `space-y-6` on container for consistent gaps
- Tab mode: Keep existing `mb-6` spacing between sections

**Testing After Each Step:**
1. Test modal view after updating modal wrappers
2. Test tab view after updating screen components
3. Verify both views for each screen before moving to next

### 6.3 Common Pitfalls to Avoid

**❌ DON'T:**
- Forget to add default value: `isModal = false`
- Remove existing CSS classes in tab mode
- Change business logic or state management
- Modify sub-modals (unlock, PSBT export)
- Change TypeScript types for other props

**✅ DO:**
- Test both modal AND tab views after changes
- Preserve all existing functionality
- Keep comments explaining conditional rendering
- Maintain accessibility attributes (aria-labelledby, etc.)
- Use TypeScript strict mode for type safety

---

## 7. Testing Checklist

### 7.1 Visual Testing

**Send Modal:**
- [ ] No black borders visible inside modal frame
- [ ] Modal title "Send Bitcoin" displays correctly at top
- [ ] Account name subtitle displays correctly
- [ ] Close button (X) visible in top-right corner
- [ ] Form fields have consistent spacing (24px between sections)
- [ ] Content cards (`bg-gray-850`) render properly
- [ ] Multisig info box displays correctly (if applicable)
- [ ] Error messages display correctly
- [ ] Transaction summary card renders properly
- [ ] Success view has no black borders
- [ ] Success view title in modal wrapper (not in content)
- [ ] Scrolling works smoothly when content overflows

**Receive Modal:**
- [ ] No black borders visible inside modal frame
- [ ] Modal title "Receive Bitcoin" displays correctly at top
- [ ] Account name subtitle displays correctly
- [ ] Close button (X) visible in top-right corner
- [ ] QR code card renders properly with correct background
- [ ] Address display card has correct styling
- [ ] Multisig badge and info display correctly (if applicable)
- [ ] All receiving addresses list renders properly
- [ ] Spacing between sections consistent (24px)
- [ ] Scrolling works smoothly when content overflows

**Send Tab (Full-Page View):**
- [ ] Full dark background (`bg-gray-950`) renders correctly
- [ ] Header bar displays with back button
- [ ] Header has correct border separator
- [ ] Content area has proper padding
- [ ] Form wrapped in content card
- [ ] All existing functionality preserved
- [ ] Success view displays correctly in tab mode

**Receive Tab (Full-Page View):**
- [ ] Full dark background (`bg-gray-950`) renders correctly
- [ ] Header bar displays with back button
- [ ] Header has correct border separator
- [ ] Content area has proper padding
- [ ] QR code and address cards display correctly
- [ ] All existing functionality preserved

### 7.2 Functional Testing

**Send Flow (Modal):**
- [ ] Modal opens correctly from Dashboard
- [ ] Address field accepts input
- [ ] Contact picker works correctly
- [ ] Amount field validates properly
- [ ] Fee selection updates correctly
- [ ] Send button submits transaction
- [ ] Unlock modal appears if wallet locked
- [ ] Success view displays after send
- [ ] Done button closes modal and refreshes
- [ ] PSBT export works for multisig accounts
- [ ] Error messages display correctly
- [ ] Close button (X) closes modal
- [ ] ESC key closes modal
- [ ] Click outside closes modal

**Receive Flow (Modal):**
- [ ] Modal opens correctly from Dashboard
- [ ] QR code generates properly
- [ ] Address displays correctly
- [ ] Copy address button works
- [ ] All addresses list displays (if multiple)
- [ ] Multisig info displays correctly (if applicable)
- [ ] Close button (X) closes modal
- [ ] ESC key closes modal
- [ ] Click outside closes modal

**Send Flow (Tab - if applicable):**
- [ ] Navigation to send screen works
- [ ] All form functionality works
- [ ] Back button navigates correctly
- [ ] Success flow works
- [ ] PSBT export works

**Receive Flow (Tab - if applicable):**
- [ ] Navigation to receive screen works
- [ ] QR code generates
- [ ] Copy address works
- [ ] Back button navigates correctly

### 7.3 Responsive Testing

- [ ] Modal displays correctly on 800px width (minimum tab width)
- [ ] Modal displays correctly on 1920px width (large screens)
- [ ] Content scrolls properly when modal height exceeds 90vh
- [ ] Close button remains visible when scrolling
- [ ] Modal title stays at top when scrolling
- [ ] No horizontal scrolling in modal
- [ ] Text wraps properly in smaller viewports

### 7.4 Accessibility Testing

- [ ] Modal has correct ARIA attributes (`role="dialog"`, `aria-modal="true"`)
- [ ] Modal title has `id` matching `aria-labelledby`
- [ ] Close button has `aria-label`
- [ ] Focus trap works within modal
- [ ] ESC key closes modal
- [ ] Tab navigation cycles through focusable elements
- [ ] First focusable element receives focus on modal open
- [ ] Focus returns to trigger element on close (if applicable)
- [ ] Screen reader announces modal correctly

### 7.5 Compatibility Testing

**Browser Testing:**
- [ ] Chrome/Edge latest
- [ ] Chrome/Edge one version back
- [ ] Firefox (optional - if supporting browser extensions)

**Account Types:**
- [ ] Single-sig account (Legacy P2PKH)
- [ ] Single-sig account (SegWit P2SH-P2WPKH)
- [ ] Single-sig account (Native SegWit P2WPKH)
- [ ] Multisig account (2-of-2)
- [ ] Multisig account (2-of-3)
- [ ] Multisig account (3-of-5)
- [ ] Imported accounts (seed phrase)
- [ ] Imported accounts (private key)

### 7.6 Edge Cases

- [ ] Empty state (no receiving address) in Receive modal
- [ ] Multiple receiving addresses (>10) scroll properly
- [ ] Long contact names don't break layout
- [ ] Very long addresses wrap correctly
- [ ] Error messages don't break layout
- [ ] Network request failures display correctly
- [ ] PSBT export modal opens over Send modal correctly
- [ ] Unlock modal opens over Send modal correctly
- [ ] Xpub address picker opens correctly

---

## 8. Success Criteria

**Visual Success:**
✅ No black borders or unwanted spacing visible in modal frames
✅ Consistent background colors throughout modal
✅ Proper visual hierarchy matches design system
✅ Clean, professional appearance

**Functional Success:**
✅ All existing features work in modal mode
✅ All existing features work in tab mode (if applicable)
✅ No regressions in business logic
✅ Type safety maintained throughout

**Code Quality Success:**
✅ Minimal code changes (conditional rendering only)
✅ No code duplication
✅ Type safety with TypeScript
✅ Backward compatibility preserved
✅ Code comments explain conditional logic

**User Experience Success:**
✅ Modal looks polished and professional
✅ Consistent with other modals in application
✅ Smooth scrolling and interactions
✅ Accessible to all users

---

## 9. Summary

This specification provides a complete solution to fix the visual layering issues in Send and Receive modals by:

1. **Adding conditional rendering** to existing components based on `isModal` prop
2. **Removing redundant visual elements** (backgrounds, headers) in modal mode
3. **Maintaining full compatibility** with tab-based routing
4. **Preserving all functionality** without code duplication
5. **Following design system** standards for consistent appearance

The solution is **implementation-ready** with detailed code examples, step-by-step instructions, and comprehensive testing criteria.

**Estimated Implementation Time:** 2-4 hours for experienced developer

**Files to Modify:**
- `src/tab/components/SendScreen.tsx` (conditional rendering)
- `src/tab/components/ReceiveScreen.tsx` (conditional rendering)
- `src/tab/components/modals/SendModal.tsx` (add title, pass prop)
- `src/tab/components/modals/ReceiveModal.tsx` (add title, pass prop)

**No New Files Required**

**Next Steps:**
1. Frontend developer implements changes following Section 6
2. Visual QA checks against Section 7.1
3. Functional testing per Section 7.2
4. Accessibility audit per Section 7.4
5. Merge to main branch

---

**End of Specification**
