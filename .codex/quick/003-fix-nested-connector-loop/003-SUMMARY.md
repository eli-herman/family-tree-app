---
phase: quick
plan: 003
subsystem: ui
tags: [react-native, tree, connectors]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: familyStore.buildFamilyTree(), FamilyMember types
provides:
  - Stable couple-center propagation for nested family units
  - Eliminated maximum update depth loop in tree screen
affects: [tree-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Couple center measured from layout and reported with change guard"

key-files:
  created: []
  modified:
    - app/(tabs)/tree.tsx
    - src/components/tree/FamilyUnitNode.tsx

key-decisions:
  - "Use couple row layout x + width/2 as the connector target for nested units"
  - "Guard parent state updates to avoid render loops"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Quick 003: Fix Nested Connector Loop Summary

**Resolved Expo Go maximum update depth error by stabilizing couple-center callbacks and measuring centers from layout.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T22:05:00Z
- **Completed:** 2026-02-06T22:08:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Couple center is derived from the couple row layout and reported only on meaningful change
- Parent state updates are guarded against identical values to prevent render loops
- Nested connectors target the actual couple center, not the wrapper center

## Task Commits

- Not committed (local changes)

## Files Created/Modified
- `app/(tabs)/tree.tsx`
- `src/components/tree/FamilyUnitNode.tsx`

## Decisions Made
- Report couple center from layout events instead of effect-based derived values

## Deviations from Plan

None.

## Issues Encountered

None.

## User Setup Required

- Reload the tree screen in Expo Go and verify the error is gone

---
*Plan: quick-003*
*Completed: 2026-02-06*
