# Changelog & Learnings

> This file tracks decisions, learnings, and updates over time.
> Claude will update this file as significant decisions are made.

---

## 2026-02-09 - Family Management Entry Point + Relationship Wizard

### What Changed

- Added a Manage Family entry on the tree screen and centralized add/edit flows in a manage modal.
- Implemented an extended relative wizard (grandparent, aunt/uncle, cousin) with anchor validation.
- Added member edit flow and store update action.

### Files Updated

- `app/(tabs)/tree.tsx`
- `app/member/[id].tsx`
- `src/stores/familyStore.ts`
- `src/types/user.ts`

## 2026-02-09 - Paywall Close Button Padding

### What Changed

- Reduced top spacing above the paywall close button by tightening header padding.

### Files Updated

- `app/paywall.tsx`

## 2026-02-09 - Paywall Close Button Spacing

### What Changed

- Adjusted paywall header layout so the close button no longer crowds the title.

### Files Updated

- `app/paywall.tsx`

## 2026-02-09 - Paywall Recommended Border Fix

### What Changed

- Removed the recommended border highlight so only the selected plan uses the green border.

### Files Updated

- `app/paywall.tsx`

## 2026-02-09 - Paywall Polish (Phase 2)

### What Changed

- Updated paywall layout to use safe-area-context insets, with footer padding that respects device safe areas and scroll content that clears the sticky footer.
- Enforced 44pt minimum touch targets for paywall controls and upgrade banner actions.
- Moved savings badge into flow to avoid overlap with the selection indicator and added tier container spacing.

### Files Updated

- `app/paywall.tsx`
- `src/components/common/UpgradeBanner.tsx`

## 2026-02-08 - Relationship Wizard Plan

### What Changed

- Began planning a guided add-member wizard for extended relatives
- Noted GitHub Education Benefits membership and recorded Student Pack tools for the project

### Files Updated

- `HANDOFF.md`
- `.claude/agents/status-board.md`
- `.claude/agents/updates-log.md`

## 2026-02-08 - Tree Focus Anchor After Add

### What Changed

- Tree now re-centers on the tapped member
- Add-sibling flow re-centers on a parent so new siblings appear in the current view

### Files Updated

- `app/(tabs)/tree.tsx`
- `app/member/[id].tsx`

## 2026-02-07 - Accessibility Pass + Tree Label Cleanup

### What Changed

- Added accessibility labels/roles/hints to interactive controls across the app
- Removed relationship labels under tree node names (kept layout logic intact)

### Files Updated

- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`
- `app/(auth)/forgot-password.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/tree.tsx`
- `app/member/[id].tsx`
- `app/paywall.tsx`
- `src/components/common/Button.tsx`
- `src/components/common/FeatureGate.tsx`
- `src/components/common/UpgradeBanner.tsx`
- `src/components/feed/FeedItem.tsx`
- `src/components/feed/PromptCard.tsx`
- `src/components/tree/TreeNode.tsx`

## 2026-02-07 - App Error Boundary

### What Changed

- Added a global `ErrorBoundary` with a safe fallback UI and retry action
- Wrapped the root layout so unexpected render errors show the fallback instead of a blank screen

### Files Updated

- `src/components/common/ErrorBoundary.tsx`
- `src/components/common/index.ts`
- `app/_layout.tsx`

## 2026-02-07 - README Badges + Banner Removal

### What Changed

- Added CI + secret scanning badges to README
- Removed ASCII terminal banner from README

### Files Updated

- `README.md`

## 2026-02-07 - Dependabot + Secret Scanning + README Banner

### What Changed

- Added Dependabot config for npm and GitHub Actions
- Updated README ASCII banner and documented secret scanning enablement

### Files Updated

- `.github/dependabot.yml`
- `README.md`

## 2026-02-07 - Audit Fix + Watchman Reset + README Banner

### What Changed

- Ran `npm audit fix` and cleared the high-severity vulnerability
- Reset Watchman watch to remove test recrawl warnings
- Updated README terminal banner to match a CLI-style look
- Lint/test/typecheck pass after dependency updates

### Files Updated

- `README.md`
- `package-lock.json`

## 2026-02-07 - Remove Deprecated jest-native

### What Changed

- Removed deprecated `@testing-library/jest-native`
- Updated Jest setup; lint/test/typecheck still pass

### Notes

- Prefer built-in matchers from `@testing-library/react-native`

### Files Updated

- `package.json`
- `package-lock.json`
- `jest.setup.ts`

## 2026-02-07 - npm install + Lint/Test/Typecheck Cleanup

### What Changed

- Updated `eslint-config-expo` to `55.0.0` and installed dependencies
- Removed lint warnings (unused imports, array type style)
- Lint/test/typecheck now pass locally

### Notes

- npm install reported deprecated packages and one high severity vulnerability
- Watchman recrawl warning appears during tests (non-blocking)

### Files Updated

- `package.json`
- `package-lock.json`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/profile.tsx`
- `app/member/[id].tsx`
- `app/paywall.tsx`
- `src/components/common/Avatar.tsx`
- `src/components/feed/FeedItem.tsx`
- `src/components/feed/PromptCard.tsx`
- `src/components/profile/ProfileHeader.tsx`
- `src/stores/familyStore.ts`
- `src/stores/subscriptionStore.ts`
- `src/types/tree.ts`

## 2026-02-07 - npm install Peer Conflict Fix

### What Changed

- Added `react-dom@19.1.0` to align with React and avoid npm ERESOLVE

### Notes

- Run `npm install` to regenerate `package-lock.json`

### Files Updated

- `package.json`

## 2026-02-07 - README Terminal Banner + Script Run Attempts

### What Changed

- Added a terminal-style "The Vine" banner with John 15:5 to `README.md`

### Notes

- `npm install` failed with ENOTFOUND (registry unreachable), so lint/test/typecheck could not run successfully.

### Files Updated

- `README.md`

## 2026-02-07 - Repo Professionalism Baseline

### What Changed

- Added README, CONTRIBUTING, and LICENSE for portfolio-ready documentation
- Added ESLint + Prettier configs and lint/format scripts
- Added Jest config and starter unit tests for relationship utilities
- Added GitHub Actions CI workflow and issue/PR templates
- Added Husky + lint-staged for pre-commit quality checks

### Notes

- Run `npm install` to fetch new dev dependencies (package-lock not updated here)

### Files Updated

- `README.md`
- `CONTRIBUTING.md`
- `LICENSE`
- `package.json`
- `.eslintrc.js`
- `.eslintignore`
- `.prettierrc`
- `.prettierignore`
- `jest.config.js`
- `jest.setup.ts`
- `src/utils/__tests__/relationships.test.ts`
- `.github/workflows/ci.yml`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
- `.husky/pre-commit`

## 2026-02-07 - Firestore Family Units + Add Member Flow

### What Changed

- Canonical family units stored in Firestore (`families/{familyId}/units`) with `partnerIds` + typed `childLinks`
- Family store derives relationships from units on load and after writes
- Added `addSpouse` + `addChild` + `addSibling` + `addParent` store actions
- Member profile modal now supports Add Spouse/Add Parent/Add Child/Add Sibling with relation types
- Tree layout + connectors support single-parent units
- Tree nodes navigate to the member modal on tap
- Tree focus selection uses current user context (spouse/children → self, else parents)
- Enforced one partner at a time (blocks adding spouse if already partnered)
- Dev-only seed writes mock data to Firestore when empty

### Notes

- Single-parent supported; one partner at a time enforced
- Child links support `biological`, `adopted`, `step`, `guardian`

### Files Updated

- `src/stores/familyStore.ts`
- `app/member/[id].tsx`
- `app/(tabs)/tree.tsx`
- `src/types/tree.ts`
- `src/types/user.ts`

## 2026-02-07 - Firebase Auth Implementation

### What Changed

- **Full auth store rewrite** — `authStore.ts` now uses real Firebase Auth SDK
  - `initialize()` subscribes to `onAuthStateChanged`, returns unsubscribe function
  - `login()`, `signup()`, `logout()`, `resetPassword()` all call Firebase methods
  - `firebaseUserToUser()` maps Firebase User to app User type
  - `getAuthErrorMessage()` maps 10 Firebase error codes to user-friendly strings
- **Auth screens** — new `app/(auth)/` route group:
  - `login.tsx` — email/password with error banner, forgot password link
  - `signup.tsx` — name/email/password/confirm with client-side validation
  - `forgot-password.tsx` — email reset with success state
  - `_layout.tsx` — Stack with fade animation
- **Root layout rewrite** — `app/_layout.tsx` now has:
  - `AuthGate` component for route protection (redirects based on auth state)
  - `LoadingScreen` with "The Vine" branding while initializing
  - Data loading gated behind `isAuthenticated`
- **Firebase service** — `src/services/firebase.ts` updated:
  - Auth with `getReactNativePersistence(AsyncStorage)` for session persistence
  - Hot-reload safe: `initializeAuth` try/catch fallback to `getAuth`
  - Config reads from `EXPO_PUBLIC_FIREBASE_*` env vars
- **Profile screen** — now uses `useAuthStore` for display name and logout

### Setup Required

1. Create Firebase project at console.firebase.google.com
2. Enable Email/Password auth provider
3. Copy config values to `.env` (see `.env.example`)
4. Test auth flow on device

### Files Created

- `app/(auth)/_layout.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`
- `app/(auth)/forgot-password.tsx`

### Files Modified

- `src/stores/authStore.ts` (full rewrite)
- `src/services/firebase.ts` (auth persistence)
- `app/_layout.tsx` (AuthGate + loading screen)
- `app/(tabs)/profile.tsx` (auth integration)

---

## 2026-02-07 - Tree Layout Refactor (Deterministic Positions) [Codex]

### What Changed

- **Codex quick-002**: Added Mila (Ella+Preston's daughter) to mock data — 12 members, 4 generations
- **Codex quick-003**: Fixed "max update depth exceeded" render loop by stabilizing couple-center callbacks
- **Codex quick-004**: Major refactor — deterministic layout with computed frames, all connectors in single SVG overlay, absolute node positioning
- **Codex quick-005** (in progress): Connector anchor alignment to spouse line midpoints, zoom bounds with maxScale floor of 1x
- Selection ring uses overlay to avoid layout shifts on tap
- `FamilyUnitNode` simplified (no longer handles measurement callbacks)
- `TreeNode` accepts `style` prop for absolute positioning

### Current Status

- Connectors still reported as jumping; needs on-device verification
- Zoom bounds behavior pending final confirmation
- `NODE_HEIGHT = 128` hardcoded in tree.tsx — may mismatch actual rendered node height

### Files Updated

- `app/(tabs)/tree.tsx` (574 lines — deterministic layout engine)
- `src/components/tree/TreeNode.tsx` (style prop, selection ring overlay)
- `src/components/tree/FamilyUnitNode.tsx` (simplified, no measurement callbacks)
- `src/utils/mockData.ts` (added Mila)

## 2026-02-02 - Subscription System Implementation

### What Changed

- **RevenueCat integration** - Installed `react-native-purchases` SDK
- **Subscription types** - Created tier definitions (free/family/legacy) with limits
- **Subscription store** - Zustand store with feature gating methods
- **Paywall screen** - Full paywall UI matching The Vine design system
- **Feature gating** - `FeatureGate` component and `useFeatureAccess` hook
- **Upgrade banners** - Soft paywall prompts at 80% of limits

### Files Created

- `src/types/subscription.ts` - Tier definitions, limits, product IDs
- `src/stores/subscriptionStore.ts` - Zustand subscription state
- `src/services/purchases.ts` - RevenueCat API wrapper
- `src/components/common/FeatureGate.tsx` - Feature gating component
- `src/components/common/UpgradeBanner.tsx` - Soft paywall banner
- `app/paywall.tsx` - Full paywall screen UI

### Subscription Tiers

| Tier   | Price    | Members   | Photos    | Audio | Video |
| ------ | -------- | --------- | --------- | ----- | ----- |
| Free   | $0       | 5         | 50        | No    | No    |
| Family | $4.99/mo | Unlimited | Unlimited | Yes   | No    |
| Legacy | $9.99/mo | Unlimited | Unlimited | Yes   | Yes   |

### Next Steps (Manual)

1. Create RevenueCat account at https://www.revenuecat.com
2. Create App Store Connect subscription products
3. Create Google Play subscription products
4. Add API keys to `src/services/purchases.ts`
5. Test on TestFlight / Internal Testing

---

## 2026-02-01 (Evening) - App Renamed to "The Vine"

### What Changed

- **App renamed from "Family Tree App" to "The Vine"**
- Biblical reference to John 15:5: "I am the vine; you are the branches"
- Name chosen after trademark research (Grapevine had conflicts)
- Bundle ID updated to `com.eliherman.thevine`

### Features Added

- **Daily Bible Verse component**
  - 14 curated verses about family, love, unity, parenting, marriage, faith, gratitude
  - Rotates daily based on day of year
  - Deep forest green background (#1B4332)
  - Displayed at top of feed

- **Scalable tree nodes**
  - Three scale levels: normal (≤2), small (3-4), tiny (5+)
  - Nodes auto-shrink as family grows

- **Thin vine connectors**
  - Changed from 3px to 1.5px
  - Circuit-like aesthetic
  - Branch color (#D4C4B0)

### Design Updates

- Color palette shifted from orange to forest greens
- Primary: #2D6A4F (Forest), #1B4332 (Deep Forest)
- Backgrounds: #FEFDFB (Warm White), #F9F7F4 (Cream)
- Splash screen background updated to Deep Forest

### Files Updated

- app.json, package.json (name, bundle ID)
- CLAUDE.md, PRD.md, app-overview.md
- All component color references

---

## 2026-02-01 (Afternoon) - MVP Implementation

### What Changed

- Implemented three core screens: Feed, Tree, Profile
- Set up Expo Router file-based navigation
- Created design system (colors, typography, spacing)
- Built reusable components (Avatar, Button, Card)

### Technical Decisions

- **Expo Router** for navigation (file-based, type-safe)
- **Zustand** for state management (simple, minimal boilerplate)
- **Firebase JS SDK** (Expo-compatible, no native modules needed)
- **react-native-svg** for tab bar icons

### Learnings

- react-native-worklets required for react-native-reanimated
- Expo Router needs `app/` at root level, not inside `src/`
- Color palette in constants should use flat structure for easy access

---

## 2026-02-01 (Morning) - Project Setup

### What Changed

- Created project structure
- Set up Claude context files in `.claude/`
- Defined initial documentation framework

### Decisions Made

- Using `.claude/` folder for context files
- CLAUDE.md as main entry point for Claude Code
- PRD.md as authoritative product spec

---

<!-- New entries will be added above this line -->
