# Frontend Implementation Decisions

**Last Updated**: October 22, 2025
**Quick Nav**: [Index](./_INDEX.md) | [Architecture](./architecture.md) | [Components](./components.md) | [State](./state.md) | [Styling](./styling.md)

---

## Overview

This document records all significant frontend architecture decisions, trade-offs, and rationale. Each decision follows the ADR (Architecture Decision Record) format.

---

## Technology Stack Decisions

### ADR-001: React 18 as UI Framework

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need a modern, performant UI framework for building a Bitcoin wallet Chrome extension with complex state management and user interactions.

**Decision**:
Use React 18 with TypeScript for the frontend.

**Rationale**:
- **Component-Based Architecture**: Perfect for wallet UI (screens, modals, forms)
- **Hooks Ecosystem**: Excellent support for custom hooks (`useWallet`, `useBackgroundMessaging`)
- **TypeScript Support**: First-class TypeScript integration for type safety
- **Chrome Extension Compatibility**: React works well with Chrome extension architecture
- **Community & Resources**: Large ecosystem, extensive documentation
- **Performance**: Virtual DOM and concurrent rendering for smooth UX
- **Developer Experience**: Familiar to most developers, fast onboarding

**Alternatives Considered**:
- **Vue 3**: Good framework, but smaller ecosystem for TypeScript
- **Svelte**: Excellent performance, but smaller community and fewer resources
- **Vanilla TypeScript**: Too much boilerplate for complex UI
- **Preact**: Smaller bundle, but missing some React features we need

**Consequences**:
- ✅ Fast development with reusable components
- ✅ Strong type safety with TypeScript
- ✅ Large community for troubleshooting
- ⚠️ Larger bundle size than Preact or Svelte
- ⚠️ Requires build step (Webpack)

---

### ADR-002: React Context + Hooks for State Management

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need state management solution for wallet data, account information, and UI state.

**Decision**:
Use React Context API with custom hooks instead of Redux, Zustand, or MobX.

**Rationale**:
- **Simplicity**: No external dependencies, built into React
- **Appropriate Scale**: Wallet extension has limited scope (not a huge app)
- **Background Service Worker**: True source of truth is background, frontend just displays
- **Short-Lived State**: Tab state is ephemeral, fetched fresh on mount
- **Custom Hooks**: Clean abstraction layer (`useWallet`, `useAccounts`, `useBalance`)
- **No Middleware Needed**: Simple async actions via `chrome.runtime.sendMessage`
- **Type Safety**: Full TypeScript support with interfaces

**Alternatives Considered**:
- **Redux**: Too complex for our needs, unnecessary boilerplate
- **Zustand**: Good option, but adds dependency for minimal benefit
- **MobX**: Overkill for our use case, steeper learning curve
- **Recoil**: Still experimental, smaller community

**Consequences**:
- ✅ Simple, maintainable codebase
- ✅ No extra dependencies
- ✅ Easy to understand for new developers
- ✅ Custom hooks provide clean API
- ⚠️ No dev tools like Redux DevTools
- ⚠️ Manual state synchronization with background

**Trade-offs Accepted**:
- We manually implement state sync (polling every 30s when unlocked)
- No time-travel debugging (not critical for wallet)
- No middleware ecosystem (we don't need it)

---

### ADR-003: Tailwind CSS for Styling

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team, UI/UX Designer

**Context**:
Need styling solution that allows rapid development while maintaining consistent design system.

**Decision**:
Use Tailwind CSS with custom configuration for Bitcoin wallet design tokens.

**Rationale**:
- **Rapid Development**: Utility-first approach speeds up UI implementation
- **Consistency**: Design system enforced through config (colors, spacing, typography)
- **Small Bundle**: Tailwind purges unused styles, optimized for production
- **Dark Mode**: Built-in dark mode support with `dark:` prefix
- **Responsive**: Easy breakpoint management (though we use full viewport)
- **No Naming Conflicts**: No need to invent class names or BEM conventions
- **Customizable**: Easy to extend with Bitcoin orange and custom gray scale

**Alternatives Considered**:
- **CSS Modules**: Good scoping, but more verbose
- **Styled Components**: Runtime cost, harder to optimize bundle
- **Emotion**: Similar to Styled Components, runtime overhead
- **Plain CSS**: Too much boilerplate, harder to maintain consistency
- **Bootstrap**: Too opinionated, harder to customize for dark mode

**Consequences**:
- ✅ Fast UI development
- ✅ Consistent design system
- ✅ Small production bundle
- ✅ Easy dark mode implementation
- ⚠️ HTML can get verbose with many classes
- ⚠️ Learning curve for developers unfamiliar with utility-first CSS

**Custom Configuration**:
- Extended gray scale (650, 750, 850, 950) for dark mode
- Bitcoin brand colors (orange, hover, active, light, subtle, muted)
- Custom shadows (glow effects for Bitcoin orange, success, error)
- Custom spacing (18, 88)
- Font families (Inter, Roboto Mono)

---

### ADR-004: Webpack 5 for Build Tool

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need build tool that supports Chrome extensions with multiple entry points and TypeScript.

**Decision**:
Use Webpack 5 with custom configuration for Chrome extension.

**Rationale**:
- **Chrome Extension Support**: Native support for multiple entry points (index.js, background.js)
- **TypeScript**: Excellent TypeScript loader integration
- **Code Splitting**: Can split vendor code from app code
- **Asset Management**: Handles images, fonts, CSS
- **Development Server**: Fast rebuilds with watch mode
- **Production Optimization**: Minification, tree shaking, code splitting
- **Mature Ecosystem**: Well-documented, large plugin ecosystem

**Alternatives Considered**:
- **Vite**: Fast dev server, but Chrome extension support requires plugins
- **Rollup**: Good for libraries, less ideal for apps
- **Parcel**: Zero config, but less control over Chrome extension structure
- **esbuild**: Extremely fast, but less mature plugin ecosystem

**Consequences**:
- ✅ Full control over build process
- ✅ Excellent Chrome extension support
- ✅ Mature, stable tool
- ⚠️ Slower dev server than Vite
- ⚠️ More configuration needed

**Configuration Highlights**:
- Dual entry points: `index` (tab) and `background` (service worker)
- HtmlWebpackPlugin for `index.html` generation
- TypeScript loader with strict mode
- Tailwind PostCSS processing
- Source maps for debugging
- Webpack DevServer with hot reload

---

## Architecture Decisions

### ADR-005: Tab-Based Architecture (Not Popup)

**Status**: Accepted
**Date**: October 14, 2025 (v0.9.0)
**Decision Makers**: Frontend Team, UI/UX Designer, Product Manager

**Context**:
Original 600x400px popup was too constrained for multisig workflows, PSBT review, and complex transaction management.

**Decision**:
Convert extension from popup-based to full browser tab with sidebar navigation.

**Rationale**:
- **UX Improvement**: 600x400 too small for multisig wizard (6 steps, QR codes)
- **Professional Design**: Full tab with sidebar matches modern crypto wallets (MetaMask, Ledger Live)
- **Better Navigation**: Persistent sidebar provides clearer information architecture
- **More Space**: Full viewport allows complex UIs (PSBT review, transaction details)
- **Security Benefits**: Easier to implement tab-based security controls (single tab enforcement, location integrity)
- **User Feedback**: Alpha testers complained popup was cramped

**Alternatives Considered**:
- **Keep Popup, Simplify UI**: Would sacrifice functionality and UX
- **Expand Popup Size**: Chrome limits popup to 800x600, still too small
- **Hybrid Approach**: Open tab only for multisig - inconsistent UX

**Migration Impact**:
- **Breaking Change**: Users must click extension icon to open tab (not automatic popup)
- **Directory Rename**: `src/popup/` → `src/tab/`
- **Build Config**: Entry renamed from `popup` to `index`
- **Manifest Change**: Removed `default_popup`, added `chrome.action.onClicked` handler
- **New Component**: Created `Sidebar.tsx` with navigation

**Consequences**:
- ✅ Much better UX for complex workflows
- ✅ Professional appearance matching desktop wallets
- ✅ Easier to add features in future
- ✅ Better security controls
- ⚠️ Requires user to click icon (not automatic popup)
- ⚠️ Larger bundle size (sidebar, security controls)

**Rollout**: v0.9.0 (October 14, 2025)

---

### ADR-006: No React Router

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need navigation between different views (Dashboard, Send, Receive, Settings, Contacts).

**Decision**:
Use simple view state management with `currentView` instead of React Router.

**Rationale**:
- **Single Page**: Tab doesn't need URL routing (no browser back button navigation expected)
- **Simpler**: State machine approach is easier to understand and maintain
- **Smaller Bundle**: React Router adds ~10KB, unnecessary for our use case
- **Sidebar Navigation**: Clicking sidebar items sets view state, no routing needed
- **No Deep Linking**: Users don't share wallet URLs, no need for routes

**Implementation**:
```typescript
type View = 'dashboard' | 'multisig' | 'contacts' | 'settings';
const [currentView, setCurrentView] = useState<View>('dashboard');

// Conditional rendering based on currentView
{currentView === 'dashboard' && <Dashboard />}
{currentView === 'multisig' && <MultisigScreen />}
{currentView === 'contacts' && <ContactsScreen />}
{currentView === 'settings' && <SettingsScreen />}
```

**Alternatives Considered**:
- **React Router**: Adds complexity and bundle size for no benefit
- **Wouter**: Lightweight alternative, but still unnecessary

**Consequences**:
- ✅ Simpler codebase
- ✅ Smaller bundle size
- ✅ Faster development
- ⚠️ No browser back button navigation (acceptable for wallet)
- ⚠️ No URL deep linking (not needed)

**May Reconsider**: If we need URL state for specific features in future.

---

### ADR-007: No Formik/React Hook Form for MVP

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Multiple forms in wallet: wallet setup, send transaction, account creation, import flows.

**Decision**:
Use controlled components with `useState` and custom validation instead of form libraries.

**Rationale**:
- **Simple Forms**: Most forms have 2-5 fields, manageable with `useState`
- **Custom Validation**: Bitcoin-specific validation (address format, WIF, BIP39) not supported by libraries
- **Bundle Size**: Formik/RHF add ~15-20KB for minimal benefit
- **Control**: Full control over validation timing and error display
- **Learning Curve**: Easier for developers unfamiliar with form libraries

**Custom Validation Examples**:
- Bitcoin address validation (BIP173 for bech32, base58 for legacy)
- WIF private key validation
- BIP39 seed phrase validation (12/24 words, valid checksum)
- Satoshi amount validation (> 0, <= balance - fee, >= dust limit 546 sats)

**Alternatives Considered**:
- **Formik**: Popular but heavy, complex API
- **React Hook Form**: Performant, but still adds dependency for limited benefit
- **Final Form**: Smaller than Formik, but still unnecessary

**Consequences**:
- ✅ Smaller bundle size
- ✅ Full control over validation
- ✅ Bitcoin-specific validation easy to implement
- ⚠️ More boilerplate for each form
- ⚠️ Manual error state management

**May Reconsider**: If we add forms with >10 fields or complex nested structures.

---

## Component Design Decisions

### ADR-008: Modal Visual Layering Fix - isModal Prop Pattern

**Status**: Accepted
**Date**: October 20, 2025
**Decision Makers**: Frontend Team

**Context**:
SendScreen and ReceiveScreen components designed for full-page tab views showed unwanted black borders/gaps when rendered inside modals.

**Problem**:
- Components had `bg-gray-950` for full-page tab layout
- Headers designed for tab view didn't fit modal context
- Different spacing/padding needed for modal vs tab rendering

**Decision**:
Add `isModal?: boolean` prop to screen components with conditional rendering instead of duplicating components.

**Implementation**:
```typescript
interface SendScreenProps {
  // ... other props
  isModal?: boolean; // Different layout for modal vs tab
}

// Conditional rendering
<div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
  {!isModal && (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <h1>Send Bitcoin</h1>
    </div>
  )}
  <div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
    {/* Content */}
  </div>
</div>
```

**Rationale**:
- **No Code Duplication**: Single component serves both use cases
- **Type Safety**: TypeScript ensures correct prop usage
- **Maintainability**: Changes to logic apply to both modal and tab rendering
- **Minimal Overhead**: One extra boolean check per render

**Alternatives Considered**:
- **Separate Components**: `SendScreen` and `SendModal` - lots of duplication
- **Wrapper Component**: Extra layer of abstraction, harder to maintain
- **CSS-Only Solution**: Couldn't cleanly hide headers in modals

**Consequences**:
- ✅ No black borders in modals
- ✅ Proper visual hierarchy matching design system
- ✅ All functionality preserved (contact picker, PSBT export, validation)
- ✅ No code duplication
- ⚠️ Slightly more complex component logic

**Files Modified**:
- `src/tab/components/SendScreen.tsx`
- `src/tab/components/ReceiveScreen.tsx`
- `src/tab/components/modals/SendModal.tsx`
- `src/tab/components/modals/ReceiveModal.tsx`

**Design Spec**: `/prompts/docs/plans/SEND_RECEIVE_MODAL_DESIGN_FIX.md`

---

### ADR-009: Component Documentation Template

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need consistent way to document components for maintainability and onboarding.

**Decision**:
Use JSDoc-style template with Purpose, Props, Usage, State Management, Design Patterns, and Notes sections.

**Template**:
```typescript
/**
 * ComponentName
 *
 * Purpose: What this component does and its primary purpose
 *
 * Props:
 * - propName: type - description of the prop
 * - optionalProp?: type - optional prop description
 *
 * Usage:
 * <ComponentName
 *   requiredProp="value"
 *   optionalProp="value"
 * />
 *
 * State Management:
 * - Describe any local state
 * - Hooks used
 * - Context dependencies
 *
 * Design Patterns:
 * - Notable patterns used
 * - Accessibility considerations
 * - Responsive behavior
 *
 * Notes:
 * - Any special considerations
 * - Known limitations
 * - Future improvements
 */
```

**Rationale**:
- **Consistency**: All components documented the same way
- **Discoverability**: New developers can find information quickly
- **Maintenance**: Easy to update when component changes
- **Examples**: Usage examples help developers use component correctly

**Consequences**:
- ✅ Better codebase documentation
- ✅ Faster onboarding
- ✅ Easier maintenance
- ⚠️ Developers must remember to update docs when changing component

---

## Library Decisions

### ADR-010: qrcode.react for QR Codes

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need to display QR codes for receive addresses and PSBT export.

**Decision**:
Use `qrcode.react` library.

**Rationale**:
- **Lightweight**: Small bundle size (~6KB)
- **React Component**: Native React component, easy to use
- **TypeScript Support**: Good type definitions
- **Customizable**: Size, error correction level, colors
- **Active Maintenance**: Regular updates, maintained library
- **Performance**: Fast rendering, no canvas issues

**Usage**:
```tsx
<QRCode
  value={`bitcoin:${address}`}
  size={256}
  level="M"  // Error correction level
  includeMargin
/>
```

**Alternatives Considered**:
- **qrcode (node)**: Not React-native, requires canvas ref
- **react-qr-code**: Similar, but smaller community
- **Custom Implementation**: Too complex, reinventing wheel

**Consequences**:
- ✅ Easy to use
- ✅ Works well with our dark theme (white background for scannability)
- ✅ Supports Bitcoin URI format
- ⚠️ External dependency

---

### ADR-011: Custom BTC/Satoshi Formatting Utilities

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
Need precise decimal handling for Bitcoin amounts (8 decimals) and USD conversion.

**Decision**:
Implement custom utility functions instead of using number formatting libraries.

**Rationale**:
- **Precision**: Need exact 8-decimal handling for satoshis → BTC
- **Control**: Full control over formatting logic
- **Avoid Floating Point**: Use integer math where possible
- **Custom Rules**: Bitcoin-specific rules (dust limit, satoshi precision)
- **No Dependencies**: Lightweight, no external libraries needed

**Implementation**:
```typescript
// src/shared/utils/price.ts
satoshisToUSD(satoshis: number, pricePerBTC: number): number
btcToUSD(btc: number, pricePerBTC: number): number
formatUSD(usd: number, includeSymbol?: boolean): string
formatSatoshisAsUSD(satoshis: number, pricePerBTC: number): string
```

**Alternatives Considered**:
- **numeral.js**: Heavy (20KB), overkill for our needs
- **accounting.js**: Good for accounting, unnecessary for Bitcoin
- **Intl.NumberFormat**: Built-in, but doesn't handle 8 decimals well

**Consequences**:
- ✅ Precise decimal handling
- ✅ Bitcoin-specific formatting
- ✅ No external dependencies
- ✅ Full control
- ⚠️ Custom code to maintain

---

## Design System Decisions

### ADR-012: Dark Mode as Primary Theme

**Status**: Accepted
**Date**: October 12, 2025 (v0.7.0)
**Decision Makers**: Frontend Team, UI/UX Designer

**Context**:
Need to choose between light mode, dark mode, or both for MVP.

**Decision**:
Implement dark mode as primary and only theme for MVP. Defer light mode to Phase 2.

**Rationale**:
- **Industry Standard**: All major crypto wallets use dark mode (MetaMask, Ledger Live, Trezor)
- **Bitcoin Orange Impact**: #F7931A has exceptional visual impact on dark backgrounds
- **Eye Strain**: Reduces eye strain for frequent wallet checking
- **OLED Power**: Lower power consumption on OLED displays
- **User Expectation**: Crypto users expect dark mode
- **Faster Development**: One theme means faster MVP delivery

**Color Philosophy**:
- **Not Pure Black**: #0F0F0F instead of #000000 for eye comfort
- **Layered Elevation**: Subtle variations (950 → 900 → 850 → 800) for depth
- **High Contrast Text**: White text on dark background (19.5:1 contrast ratio ✅ AAA)
- **Bitcoin Orange Accent**: Bright enough to stand out (#F7931A = 8.1:1 contrast ✅ AAA)

**Accessibility**:
All color combinations meet or exceed WCAG 2.1 AA standards (most meet AAA):
- Primary text: 19.5:1 ✅ AAA
- Secondary text: 11.2:1 ✅ AAA
- Tertiary text: 7.3:1 ✅ AAA
- Borders: 3.8:1 ✅ AA
- Bitcoin orange: 8.1:1 ✅ AAA

**Special Cases**:
- **QR Codes**: WHITE background (critical for scannability)
- **Seed Phrases**: Dark background with orange border and glow
- **Modals**: Gray-850 with backdrop blur

**Consequences**:
- ✅ Professional appearance matching industry standards
- ✅ Excellent Bitcoin orange visual impact
- ✅ Reduced eye strain
- ✅ Single theme means faster development
- ⚠️ No light mode for users who prefer it
- ⚠️ Must implement light mode in Phase 2 if users request

**Future**: Light mode as Phase 2 feature based on user demand.

---

### ADR-013: Custom Scrollbar Styling

**Status**: Accepted
**Date**: October 13, 2025
**Decision Makers**: Frontend Team, UI/UX Designer

**Context**:
Default scrollbars don't match dark mode aesthetic and Bitcoin brand.

**Decision**:
Implement custom scrollbar styling with "Minimalist Dark with Orange Accent" design.

**Rationale**:
- **Brand Consistency**: Orange hover state reinforces Bitcoin branding
- **Subtle at Rest**: Gray scrollbar doesn't compete with content
- **Professional Feel**: Polished, cohesive look
- **User Feedback**: Shows scrollable context without cluttering interface

**Design**:
- Width: 8px (slim profile)
- Track: Transparent (normal), gray-800 (hover)
- Thumb: gray-600 (rest), Bitcoin orange (hover), orange-dark (active)
- Border radius: 4px
- Transitions: 200ms ease (track), 150ms ease (thumb)

**Accessibility**:
- Respects `prefers-reduced-motion` media query
- Sufficient color contrast for visibility
- Large enough target area (40px min height)

**Browser Support**:
- Full: Chrome, Edge, Safari, Opera (webkit)
- Partial: Firefox (simpler API, no hover states)
- Graceful degradation: Others use default scrollbars

**Consequences**:
- ✅ Cohesive dark mode design
- ✅ Bitcoin brand reinforcement
- ✅ Professional appearance
- ⚠️ Limited browser support (but graceful degradation)

---

## Performance Decisions

### ADR-014: QR Code Lazy Loading

**Status**: Accepted
**Date**: October 2025
**Decision Makers**: Frontend Team

**Context**:
QR code generation can be expensive, especially for large data (PSBT chunks).

**Decision**:
Lazy load QR code component and only render when ReceiveScreen is visible.

**Implementation**:
```typescript
const QRCode = React.lazy(() => import('./QRCode'));

{showQR && (
  <Suspense fallback={<Spinner />}>
    <QRCode value={address} />
  </Suspense>
)}
```

**Rationale**:
- **Performance**: Don't generate QR codes until needed
- **Bundle Splitting**: QR library loaded on demand
- **UX**: Suspense provides loading feedback

**Consequences**:
- ✅ Faster initial load
- ✅ QR code only generated when needed
- ⚠️ Slight delay when showing QR first time (cached after)

---

## Future Decisions to Make

### Pending: Component Library Extraction

**Status**: Under Consideration
**Context**: Many reusable components (Button, Input, Card, Modal) could be extracted to shared library.

**Options**:
1. **Keep Inline**: Current approach, components live in codebase
2. **Internal Package**: Extract to `@wallet/ui` package
3. **Public Library**: Open source component library

**Next Steps**: Evaluate based on code reuse across multiple wallet projects.

---

### Pending: TypeScript Strict Mode

**Status**: Partially Implemented
**Context**: Using TypeScript strict mode, but some files have `any` types.

**Goal**: Achieve 100% type coverage, eliminate all `any` types.

**Next Steps**: Gradual migration, prioritize high-risk areas (transaction building, crypto operations).

---

### Pending: Internationalization (i18n)

**Status**: Not Started
**Context**: Wallet is English-only. Considering multi-language support.

**Options**:
1. **react-i18next**: Most popular React i18n library
2. **Format.js**: Smaller, Intl-based
3. **Custom Solution**: Simple JSON translations

**Next Steps**: User research on language demand, Phase 2 feature.

---

**Related Documentation**:
- [Architecture](./architecture.md) - Implementation of decisions
- [Components](./components.md) - Component patterns from decisions
- [State Management](./state.md) - State architecture from decisions
- [Styling System](./styling.md) - Design system from decisions
