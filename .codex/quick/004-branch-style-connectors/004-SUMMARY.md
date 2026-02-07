---
phase: quick
plan: 004
subsystem: ui
tags: [react-native, tree, connectors, svg]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: familyStore.buildFamilyTree(), FamilyMember types
provides:
  - SVG overlay connectors anchored to measured node frames
  - Branch-style stems and rails with rounded ends
affects: [tree-interactions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Measure node frames relative to tree container"
    - "Single SVG overlay for all connectors"

key-files:
  created: []
  modified:
    - app/(tabs)/tree.tsx
    - src/components/tree/FamilyUnitNode.tsx
    - src/components/tree/TreeNode.tsx

key-decisions:
  - "Spouse connectors attach to left/right node edges"
  - "Parent-child stems originate from spouse line midpoint"
  - "Rounded line ends for a softer branch feel"

# Metrics
duration: 6min
completed: 2026-02-06
---

# Quick 004: Branch-Style Connectors Summary

**Reworked tree connectors into a single SVG overlay anchored to measured node frames, so lines attach directly to node edges.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-06T22:25:00Z
- **Completed:** 2026-02-06T22:31:00Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- TreeNode now reports measured frames relative to the tree container
- FamilyUnitNode passes measurement props down to all nested nodes
- Tree screen draws spouse lines, stems, rails, and drops in a single SVG overlay
- Connector lines use rounded caps for a softer branch feel
- Switched measurement to `measure` + tree page offsets to avoid `measureLayout` native ref errors

## Task Commits

- Not committed (local changes)

## Files Created/Modified
- `app/(tabs)/tree.tsx`
- `src/components/tree/FamilyUnitNode.tsx`
- `src/components/tree/TreeNode.tsx`

## Decisions Made
- Anchor spouse lines to node left/right edges
- Anchor parent-child drops to child top edges (single) or couple midpoint (nested)

## Deviations from Plan

None.

## Issues Encountered

None.

## User Setup Required

- Reload the tree screen in Expo Go to verify connectors attach to node edges

---
*Plan: quick-004*
*Completed: 2026-02-06*
