---
device: Elis-MacBook-Pro.local
branch: main
commit: a36bd2d
timestamp: "2026-02-07T05:23:45Z"
---

# Session Handoff

## Summary

Two major workstreams completed across Claude + Codex sessions:

1. **Firebase Auth Implementation** (new) — Full auth flow with login, signup, forgot-password screens. `authStore.ts` rewritten to use real Firebase Auth SDK with `onAuthStateChanged` listener. `_layout.tsx` has `AuthGate` for route protection. Auth screens require Firebase project setup to function (config uses env var placeholders — see `.env.example`).

2. **Tree Deterministic Layout** (Codex quick tasks 002-005) — Tree screen rewritten from measurement-based to deterministic computed layout. All node positions calculated upfront via `layoutUnit()` + `buildTreeLayout()`, rendered with absolute positioning. Connectors drawn in single SVG overlay. Mila added as 4th-generation member. Connector jumping still reported per Codex sessions — needs on-device verification.

## Files Changed

### Auth (New)
- `app/(auth)/_layout.tsx` — Stack with fade animation
- `app/(auth)/login.tsx` — Email/password login with error handling
- `app/(auth)/signup.tsx` — Name/email/password/confirm with client validation
- `app/(auth)/forgot-password.tsx` — Email reset with success state
- `src/stores/authStore.ts` — Full rewrite: Firebase Auth SDK integration
- `src/services/firebase.ts` — Auth persistence with AsyncStorage
- `app/_layout.tsx` — AuthGate redirect pattern, LoadingScreen
- `app/(tabs)/profile.tsx` — Uses authStore for display name + logout

### Tree Refactor (Codex)
- `app/(tabs)/tree.tsx` — 574 lines, deterministic layout engine with single SVG connector overlay
- `src/components/tree/TreeNode.tsx` — Added `style` prop, selection ring as overlay
- `src/components/tree/FamilyUnitNode.tsx` — Simplified (no measurement callbacks)
- `src/components/tree/index.ts` — Updated exports
- `src/utils/mockData.ts` — Added Mila (Ella+Preston's daughter)
- `src/stores/familyStore.ts` — buildFamilyTree with recursive buildUnit

### Documentation
- `.planning/STATE.md` — Updated with auth work, Codex tasks, blockers
- `.claude/changelog.md` — Auth entry + Codex tree refactor entry
- `.claude/agents/updates-log.md` — Auth + tree layout refactor notes
- `HANDOFF.md` — This file

## Architecture: Tree Screen (Current State)

```
tree.tsx
  layoutUnit(unit) → { width, height, frames, variants }  // recursive
  buildTreeLayout(centerUnit, grandparents) → TreeLayout   // full tree

  Rendering:
  - Absolute-positioned <TreeNode> for each member (from computed frames)
  - Single <Svg> overlay with <Line> segments for all connectors
  - Connectors: spouse lines + stems + rails + drops
  - No measurement-driven re-renders
```

Key constants in `tree.tsx`:
- `NODE_WIDTH = 100`, `NODE_HEIGHT = 128` (must match actual TreeNode render size)
- `CONNECTOR_GAP = 48`, `COUPLE_GAP = 16`, `SPOUSE_GAP = 48`
- `ZOOM_IN_MULTIPLIER = 3`, maxScale floor of 1x

## Architecture: Auth Flow

```
_layout.tsx
  RootLayout
    ├── useEffect → authStore.initialize() (onAuthStateChanged listener)
    ├── AuthGate
    │   ├── !isInitialized → LoadingScreen ("The Vine" branding)
    │   ├── !isAuthenticated + not in (auth) → Redirect to /(auth)/login
    │   ├── isAuthenticated + in (auth) → Redirect to /(tabs)
    │   └── else → render children
    └── Stack: (tabs), (auth), member/[id]

authStore.ts
  ├── initialize() → onAuthStateChanged subscription
  ├── login(email, password) → signInWithEmailAndPassword
  ├── signup(email, password, displayName) → createUserWithEmailAndPassword + updateProfile
  ├── logout() → signOut
  ├── resetPassword(email) → sendPasswordResetEmail
  └── getAuthErrorMessage(code) → user-friendly string (10 cases)
```

## Open Issues

1. **Connector jumping** — Codex reports connectors still jump on tap. The deterministic layout should fix this but needs on-device verification. If it persists, check `NODE_HEIGHT = 128` vs actual rendered height.

2. **Firebase project not created** — Auth screens exist but Firebase project needs to be set up. Until then, the app will show auth screens but login won't work. See `.env.example` for required vars.

3. **Dead code** — `VineConnector.tsx` exports (`FamilyConnector`, `SpouseConnector`, `GenerationConnector`) are no longer used by `tree.tsx`. `FamilyUnitNode` is also not used by tree.tsx (it renders everything flat). These could be cleaned up.

4. **Codex quick-005** — Still marked in-progress. The zoom bounds and connector anchor work was applied but not formally closed.

## Next Steps (Priority Order)

1. **Verify tree on device** — Run `npx expo start`, check connector stability and zoom behavior
2. **Create Firebase project** — Set up project, enable Email/Password auth, add config to `.env`
3. **Add dev mode bypass** — Consider a toggle to skip auth during development so tree/feed screens remain accessible without Firebase
4. **Phase 2: Paywall Polish** — Next roadmap phase per `.planning/ROADMAP.md`
5. **Clean up dead code** — Remove unused VineConnector exports and simplify FamilyUnitNode

## Reference Files

| File | Purpose |
|------|---------|
| `.planning/STATE.md` | Full project state with all decisions and progress |
| `.planning/ROADMAP.md` | 8-phase roadmap with requirements |
| `.claude/changelog.md` | Chronological decisions and learnings |
| `.env.example` | Firebase config template |
| `.codex/quick/` | Codex task plans and summaries (002-005) |
| `.planning/quick/` | Claude GSD task plans (001) |

## Mock Data: Herman Family (12 Members, 4 Generations)

```
Gen 0: Peggy + Ron (maternal)     James + Linda (paternal)
              |                          |
Gen 1:     Shelby ──────────────── Timothy
              |
Gen 2: Ella+Preston   Eli   Bennett   Ember
              |
Gen 3:     Mila
```
