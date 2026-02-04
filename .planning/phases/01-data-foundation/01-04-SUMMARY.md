---
phase: 01-data-foundation
plan: 04
subsystem: ui
tags: [zustand, react-native, expo-router, stores]

# Dependency graph
requires:
  - phase: 01-data-foundation (plan 02)
    provides: familyStore, userStore with loadData and selectors
  - phase: 01-data-foundation (plan 03)
    provides: feedStore with loadData, toggleHeart, comments, and selectors
provides:
  - Store initialization on app mount via useEffect in root layout
  - Feed screen reads items and toggleHeart from feedStore
  - Tree screen reads members via getMembersByGeneration from familyStore
  - All screens show loading indicators while stores initialize
affects: [member-profile-modal, tree-interactions, feed-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel store initialization via Promise.all in root layout useEffect"
    - "Zustand selector subscriptions per-field to minimize re-renders"
    - "Loading state guard pattern: early return with ActivityIndicator while isLoading"

key-files:
  created: []
  modified:
    - app/_layout.tsx
    - app/(tabs)/index.tsx
    - app/(tabs)/tree.tsx

key-decisions:
  - "Pass currentMemberId || '' to FeedItem currentUserId prop to satisfy string type while store value is string | null"

patterns-established:
  - "Screen components subscribe to store state via individual selector hooks, not full store"
  - "Loading indicators use colors.primary.main for consistent theming"

# Metrics
duration: 2min
completed: 2026-02-04
---

# Phase 1 Plan 4: Wire Screens to Stores Summary

**Zustand stores wired to Feed and Tree screens with parallel async initialization in root layout, replacing all local state and mock imports**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-04T18:04:35Z
- **Completed:** 2026-02-04T18:06:03Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Root layout initializes all three stores (family, user, feed) in parallel on mount via Promise.all in useEffect
- Feed screen reads items and heart-toggle actions entirely from feedStore; hardcoded local state removed
- Tree screen reads family members by generation from familyStore's getMembersByGeneration selector, replacing inline filter logic that misclassified Timothy and Preston
- Both screens display ActivityIndicator while their respective stores are loading

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize stores on app mount** - `fe227ec` (feat)
2. **Task 2: Wire Feed screen to feedStore and useUserStore** - `0601893` (feat)
3. **Task 3: Wire Tree screen to familyStore** - `6220ffa` (feat — includes color-key auto-fix)

**Plan metadata:** see docs commit below

## Files Created/Modified
- `app/_layout.tsx` — Added useEffect with Promise.all to call loadData() on familyStore, userStore, and feedStore on mount
- `app/(tabs)/index.tsx` — Replaced useState feedItems with useFeedStore items/toggleHeart/isLoading; replaced hardcoded currentUserId with useUserStore currentMemberId; added loading indicator
- `app/(tabs)/tree.tsx` — Replaced mockFamilyMembers import and inline filter with useFamilyStore getMembersByGeneration; added loading indicator

## Decisions Made
- Pass `currentMemberId || ''` to FeedItem's `currentUserId` prop: the store type is `string | null` but the component prop requires `string`. The empty string is safe because heart-toggle is already guarded by a `currentMemberId` null check in handleHeart.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect color token on ActivityIndicator**
- **Found during:** Final TypeScript verification (`npx tsc --noEmit`)
- **Issue:** Both loading indicators used `colors.primary.base` which does not exist on the color object. The correct key is `colors.primary.main`.
- **Fix:** Changed to `colors.primary.main` in both `app/(tabs)/index.tsx` and `app/(tabs)/tree.tsx`
- **Files modified:** app/(tabs)/index.tsx, app/(tabs)/tree.tsx
- **Verification:** `npx tsc --noEmit` exits clean with zero errors
- **Committed in:** 6220ffa (amended into Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Single token typo, no scope change. Both files needed the same fix.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 1 (Data Foundation) is now complete — all 4 plans executed and verified
- All stores initialize on mount, all screens read from stores, TypeScript compiles cleanly
- Ready for Phase 2 (Paywall Polish) or Phase 3 (Member Profile Modal) — see ROADMAP.md dependency graph

---
*Phase: 01-data-foundation*
*Completed: 2026-02-04*
