# Updates Log

> Chronological record of all changes and decisions
> Newest entries at the top

---

## 2026-02-08 - Tree Focus Anchor After Add

### Changes

- Tree now sets focus to the tapped member when opening their profile
- Add-sibling flow re-centers on a parent so newly added siblings appear in the tree

### Files Affected

- `app/(tabs)/tree.tsx`
- `app/member/[id].tsx`
- `HANDOFF.md`
- `.claude/agents/status-board.md`

### For Other Agents

- This is a UX-first fix; full extended-family rendering is still out of scope.

## 2026-02-07 - Accessibility Pass + Tree Label Cleanup

### Changes

- Added accessibility labels/roles/hints to touchables across auth, profile, paywall, tree, and member screens
- Removed relationship text labels under tree node names (layout still uses relationships)

### Files Affected

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
- `.claude/agents/status-board.md`
- `HANDOFF.md`

### For Other Agents

- Run a quick VoiceOver/TalkBack pass to confirm labels read cleanly.

## 2026-02-07 - App Error Boundary

### Changes

- Added a global `ErrorBoundary` component with a safe fallback UI + retry button
- Wrapped the app root layout with the boundary

### Files Affected

- `src/components/common/ErrorBoundary.tsx`
- `src/components/common/index.ts`
- `app/_layout.tsx`
- `.claude/agents/status-board.md`
- `HANDOFF.md`

### For Other Agents

- If you want per-tab isolation, add route-level boundaries later; this is app-wide for now.

## 2026-02-07 - README Badges + Banner Removal

### Changes

- Added CI + secret scanning badges to README
- Removed ASCII terminal banner from README

### Files Affected

- `README.md`
- `.claude/agents/status-board.md`

## 2026-02-07 - Dependabot + Secret Scanning + README Banner

### Changes

- Added `dependabot.yml` for npm + GitHub Actions updates
- Updated README terminal banner to a cleaner ASCII style
- Added README note for enabling GitHub secret scanning

### Decisions Made

- Grouped Dependabot updates to reduce PR noise

### Files Affected

- `.github/dependabot.yml`
- `README.md`
- `.claude/agents/status-board.md`

### For Other Agents

- Secret scanning must be enabled in GitHub repository settings.

## 2026-02-07 - Audit Fix + Watchman Reset + README Banner

### Changes

- Ran `npm audit fix` and cleared the high-severity vulnerability
- Reset Watchman watch to remove recrawl warnings
- Updated README terminal banner to a CLI-style ascii block
- Re-ran lint/test/typecheck (all clean)

### Decisions Made

- Keep banner ASCII-only for portability

### Files Affected

- `README.md`
- `package-lock.json`
- `.claude/agents/status-board.md`

### For Other Agents

- `npm audit` is clean; watchman warning resolved.

## 2026-02-07 - Remove Deprecated jest-native

### Changes

- Removed deprecated `@testing-library/jest-native`
- Updated `jest.setup.ts` accordingly
- Re-ran npm install, lint, test, and typecheck (all clean)

### Decisions Made

- Prefer built-in matchers from `@testing-library/react-native`

### Files Affected

- `package.json`
- `package-lock.json`
- `jest.setup.ts`

### For Other Agents

- Watchman recrawl warning may still appear during tests (non-blocking).

## 2026-02-07 - npm install + Lint/Test/Typecheck Cleanup

### Changes

- Set `eslint-config-expo` to `55.0.0` and ran `npm install`
- Cleaned lint warnings (unused imports + Array<T> style)
- Lint/test/typecheck now pass

### Decisions Made

- Use the latest stable eslint-config-expo to resolve ETARGET

### Files Affected

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

### For Other Agents

- `npm install` reported deprecated packages and one high-severity vulnerability; consider `npm audit` review.
- Watchman recrawl warning appeared during tests.

## 2026-02-07 - npm install Peer Conflict Fix

### Changes

- Pinned `react-dom@19.1.0` to match the project's React version

### Decisions Made

- Align React + React DOM versions to avoid npm ERESOLVE during install

### Files Affected

- `package.json`

### For Other Agents

- Re-run `npm install` after pulling to regenerate lockfile.

## 2026-02-07 - Repo Professionalism Run + README Banner

### Changes

- Added a terminal-style banner to `README.md` with "The Vine" + John 15:5

### Decisions Made

- Attempted to run `npm install` and quality scripts in order per request

### Files Affected

- `README.md`
- `.claude/agents/status-board.md`

### For Other Agents

- npm install failed with ENOTFOUND (registry unreachable), so lint/test/typecheck failed due to missing deps.

## 2026-02-07 - Repo Professionalism Baseline

### Changes

- Added README, CONTRIBUTING, and LICENSE files
- Added ESLint + Prettier configs with lint/format scripts
- Added Jest config + initial unit tests for relationship utilities
- Added GitHub Actions CI workflow and issue/PR templates
- Added Husky + lint-staged configuration for pre-commit checks

### Decisions Made

- Focused on repo hygiene to make the project portfolio-ready
- Started tests in utilities to avoid React Native runtime setup in CI

### Files Affected

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

### For Other Agents

- Run `npm install` to pull new dev dependencies (package-lock not updated here).

## 2026-02-07 - Firestore Family Units + Add Member Flow

### Changes

- Added Firestore-backed family units (`families/{familyId}/units`) with `partnerIds` + typed `childLinks`
- Family store now derives relationships from units and seeds Firestore in dev if empty
- Added `addSpouse`, `addChild`, `addSibling`, and `addParent` store actions
- Member profile modal now supports Add Spouse/Add Parent/Add Child/Add Sibling with relation types
- Tree layout + connectors support single-parent units; focus uses current user context
- Enforced one partner at a time (blocks adding spouse if already partnered)

### Decisions Made

- Canonical units: relationships derived at runtime (members no longer store relationships in Firestore)
- Single-parent supported; one partner at a time enforced (no concurrent partners)

### Files Affected

- `src/stores/familyStore.ts`
- `app/member/[id].tsx`
- `app/(tabs)/tree.tsx`
- `src/types/tree.ts`
- `src/types/user.ts`
- `src/utils/relationships.ts`

### For Other Agents

- Add-child works with single-parent or partnered units (relation type required)
- Firestore seed uses `families/demo-family/*` in dev

## 2026-02-07 - Firebase Auth Implementation

### Changes

- Full auth store rewrite with Firebase Auth SDK (login, signup, logout, resetPassword)
- Created auth screens: login, signup, forgot-password under `app/(auth)/`
- Root layout now has AuthGate for route protection + LoadingScreen
- Firebase service updated with AsyncStorage persistence (hot-reload safe)
- Profile screen wired to authStore for display name and logout
- `.env.example` already exists with Firebase config template

### Decisions Made

- `onAuthStateChanged` listener pattern (initialize returns unsubscribe)
- AuthGate redirect: unauthenticated to login, authenticated away from auth screens
- User-friendly error messages via `getAuthErrorMessage()` (10 Firebase error codes)
- Data loading gated behind `isAuthenticated` in root layout

### Files Affected

- `app/(auth)/_layout.tsx` (new)
- `app/(auth)/login.tsx` (new)
- `app/(auth)/signup.tsx` (new)
- `app/(auth)/forgot-password.tsx` (new)
- `src/stores/authStore.ts` (rewrite)
- `src/services/firebase.ts` (modified)
- `app/_layout.tsx` (rewrite)
- `app/(tabs)/profile.tsx` (modified)

### For Other Agents

- Auth requires Firebase project setup — currently uses placeholder env vars
- Until Firebase is configured, app will show login screen but can't authenticate
- Consider adding a dev mode bypass for testing other screens

---

## 2026-02-07 - Tree Layout Refactor (Connectors)

### Changes

- Started deterministic layout approach for tree nodes to reduce connector jumping
- Updated `TreeNode` to accept positioning styles and removed measurement props from `FamilyUnitNode`
- Added rail-span fix so parent connectors include the couple midpoint and reach offset child anchors
- Ensured maxScale allows zoom-in even when minScale is small
- Locked `TreeNode` to fixed width/height constants shared with layout math
- Exported `TREE_NODE_WIDTH/HEIGHT` via `src/components/tree/index.ts` so layout constants resolve correctly

### Decisions Made

- Use computed frames for node positions instead of `measure` callbacks
- Keep selection ring as overlay to prevent layout shifts
- Max zoom-out = fit full tree; zoom-in allowed up to a multiplier with a floor of 1x

### Files Affected

- `app/(tabs)/tree.tsx`
- `src/components/tree/TreeNode.tsx`
- `src/components/tree/FamilyUnitNode.tsx`

### For Other Agents

- Connectors still reported as jumping; verify on-device and adjust layout constants if needed

## 2026-02-01 - PRD Finalized & Design System Updated

### Changes

- Added comprehensive PRD (Product Requirements Document)
- Updated design-spec.md to match PRD vision
- Updated packages.md with full tech stack
- Updated CLAUDE.md with new context structure

### Decisions Made

- **Design Inspiration:** Duolingo (approachability) + Brilliant (clarity)
- **Tech Stack:** React Native (Expo) + Firebase
- **Primary Color:** Warm indigo (#6366F1)
- **Typography:** Inter font family
- **Spacing:** 4px base grid
- **MVP Scope:** Feed, Tree, Profiles only - no comments, no AI features

### Core UX Principles (DO NOT VIOLATE)

1. No mandatory posting or forced interaction
2. No guilt-based prompts
3. Users can browse without contributing
4. App must feel alive with 1-2 active members
5. Emotional tone: "This feels nice to open"

### For Other Agents

- **READ PRD.md FIRST** - it's the authoritative source
- Design spec updated to match PRD
- Avoid social media patterns at all costs
- No metrics, scores, or gamification

---

## 2026-02-01 - Project Setup

### Changes

- Created project structure
- Set up Claude context system
- Created agent coordination protocol
- Defined initial design specification

### Decisions Made

- Using `.claude/` folder for context files
- CLAUDE.md as main entry point
- Agent coordination system for multi-agent work

### For Other Agents

- All agents must read `design-spec.md` before any UI work
- Follow coordination protocol in `coordination.md`
- Update status board before starting tasks

---

<!-- New entries go above this line -->

## Entry Template

```markdown
## [Date] - [Task/Feature Name]

### Changes

- [Bullet points of what changed]

### Decisions Made

- [Decisions with rationale]

### Files Affected

- [List of files created/modified]

### For Other Agents

- [Important notes for other agents]
```
