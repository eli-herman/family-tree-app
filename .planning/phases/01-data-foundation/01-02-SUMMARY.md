---
phase: 01-data-foundation
plan: 02
subsystem: stores
tags: [zustand, familyStore, userStore, async-loading, selectors]

# Dependency graph
requires:
  - phase: 01-01
    provides: mockFamilyMembers data and calculateRelationship utility
provides:
  - useFamilyStore with async loadData and member selectors
  - useUserStore with currentMemberId and preferences
affects: [01-03, 01-04, phase-3, phase-4, phase-5]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async loadData pattern for stores (mimics Firebase)"
    - "Selectors as store methods using get()"
    - "currentUserId passed as parameter (not accessed via hooks in store)"

key-files:
  created:
    - src/stores/familyStore.ts
    - src/stores/userStore.ts
  modified:
    - src/stores/index.ts

key-decisions:
  - "calculateRelationship takes currentUserId as parameter - caller responsible for getting from userStore"
  - "Generation calculation simplified for Herman family: 0=no parents, 1=has parents+children, 2=has parents only"

patterns-established:
  - "Async loadData() with simulated delay for Firebase compatibility"
  - "Selectors implemented as store methods using get() pattern"

# Metrics
duration: 2 min
completed: 2026-02-03
---

# Phase 01 Plan 02: familyStore-userStore Summary

**Zustand stores for family members and current user with async loading, selectors, and relationship calculations**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-03T16:01:38Z
- **Completed:** 2026-02-03T16:03:13Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created useFamilyStore with async loadData pattern (100ms simulated delay for Firebase compatibility)
- Added getMemberById, calculateRelationship, getMembersByGeneration, getSpouseOf, getChildrenOf, getParentsOf selectors
- Created useUserStore with currentMemberId (hardcoded to 'eli' for MVP) and preferences state
- Exported both stores from src/stores/index.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create familyStore with async loading** - `dfd1dab` (feat)
2. **Task 2: Create userStore for current user** - `6fdc481` (feat)
3. **Task 3: Export new stores from index** - `7d6ee8e` (feat)

## Files Created/Modified

- `src/stores/familyStore.ts` - Family state management with members array, loading states, and selectors
- `src/stores/userStore.ts` - User state management with currentMemberId and preferences
- `src/stores/index.ts` - Added useFamilyStore and useUserStore exports

## Decisions Made

1. **calculateRelationship takes currentUserId as parameter** - Caller supplies currentUserId from userStore rather than accessing hooks inside store actions (which would crash React)
2. **getMembersByGeneration simplified for Herman family structure** - Generation 0 = no parent relationships (grandparents), Generation 1 = has parents AND (has children OR spouse has children), Generation 2 = has parents but no children

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in mockData.ts (FeedItem missing comments property) - unrelated to this plan's scope. The new store files have no TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- familyStore ready for use by tree and profile screens
- userStore ready for providing currentMemberId to calculateRelationship calls
- Ready for 01-03-PLAN.md (feedStore enhancements)

---
*Phase: 01-data-foundation*
*Completed: 2026-02-03*
