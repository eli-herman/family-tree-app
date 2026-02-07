# Updates Log

> Chronological record of all changes and decisions
> Newest entries at the top

---

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
