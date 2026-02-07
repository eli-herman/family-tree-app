---
device: Mac.lan
branch: main
commit: a36bd2d
timestamp: "2026-02-07T05:23:45Z"
---

# Session Handoff

## Summary
Last commit: `a36bd2d` on `main`
> feat: add Firebase auth flow + deterministic tree layout

Auth:
- Full auth store rewrite with Firebase Auth SDK (login, signup, logout, resetPassword)
- Auth screens: login, signup, forgot-password under app/(auth)/
- AuthGate in _layout.tsx for route protection + LoadingScreen
- Firebase service with AsyncStorage persistence (hot-reload safe)
- Profile screen wired to authStore for display name and logout

Tree (Codex quick tasks 002-005):
- Deterministic layout: computed frames + absolute positioning (no measurement jitter)
- Single SVG overlay for all connectors (spouse lines, stems, rails, drops)
- Added Mila (Ella+Preston's daughter) — 12 members, 4 generations
- Fixed render loop from couple-center callbacks
- Selection ring as overlay to prevent layout shifts
- Zoom bounds: minScale fits full tree, maxScale floor of 1x

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

## Files Changed

- app/(auth)/_layout.tsx
- app/(auth)/forgot-password.tsx
- app/(auth)/login.tsx
- app/(auth)/signup.tsx
- app/(tabs)/profile.tsx
- app/(tabs)/tree.tsx
- app/_layout.tsx
- package-lock.json
- package.json
- src/components/tree/FamilyUnitNode.tsx
- src/components/tree/TreeNode.tsx
- src/components/tree/VineConnector.tsx
- src/components/tree/index.ts
- src/services/firebase.ts
- src/stores/authStore.ts
- src/stores/familyStore.ts
- src/types/index.ts
- src/types/tree.ts
- src/utils/mockData.ts

## Diff Stats
```
 app/(auth)/_layout.tsx                 |  12 +
 app/(auth)/forgot-password.tsx         | 211 ++++++++++++
 app/(auth)/login.tsx                   | 226 +++++++++++++
 app/(auth)/signup.tsx                  | 268 +++++++++++++++
 app/(tabs)/profile.tsx                 |   8 +-
 app/(tabs)/tree.tsx                    | 595 +++++++++++++++++++++++----------
 app/_layout.tsx                        |  84 ++++-
 package-lock.json                      | 134 ++------
 package.json                           |   8 +-
 src/components/tree/FamilyUnitNode.tsx | 106 ++----
 src/components/tree/TreeNode.tsx       |  52 ++-
 src/components/tree/VineConnector.tsx  |   2 +-
 src/components/tree/index.ts           |  12 +-
 src/services/firebase.ts               |  17 +-
 src/stores/authStore.ts                | 138 +++++++-
 src/stores/familyStore.ts              |  67 +++-
 src/types/index.ts                     |   1 +
 src/types/tree.ts                      |  20 ++
 src/utils/mockData.ts                  |  56 ++++
 19 files changed, 1605 insertions(+), 412 deletions(-)
```

## Active Tasks
_Update manually or via MCP tool._

## Blockers
_None detected._

## Next Steps
_See AI Summary below for suggestions._

## AI Summary
This commit introduces Firebase authentication and a deterministic tree layout for the application. It includes new authentication screens, an AuthGate for route protection, and updates to the family tree component for smoother rendering and better user experience. The changes are essential for enhancing security and usability, making it easier for developers to switch devices or collaborate on the project.
