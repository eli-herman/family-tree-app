---
phase: quick
plan: 001
subsystem: ui
tags: [react-native, svg, gesture-handler, reanimated, family-tree, pinch-zoom]

# Dependency graph
requires:
  - phase: 01-data-foundation
    provides: familyStore.buildFamilyTree(), FamilyMember types, mock data
provides:
  - Fixed FamilyConnector SVG paths (stem + rail + drops for every child)
  - Height-aware SpouseConnector between ancestor branches
  - Comfortable grandparent spacing (48px between branches, 16px between spouses)
  - Gesture-based pan + pinch-to-zoom on tree screen
affects: [tree-interactions, cross-platform-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gesture.Simultaneous(Pan, Pinch) for combined tree navigation"
    - "useSharedValue + useAnimatedStyle for performant gesture transforms"
    - "Dynamic minScale from viewport/tree layout measurement"
    - "SpouseConnector height prop for vertical centering between ancestor branches"

key-files:
  created: []
  modified:
    - app/(tabs)/tree.tsx
    - src/components/tree/VineConnector.tsx
    - src/components/tree/FamilyUnitNode.tsx

key-decisions:
  - "FamilyConnector multi-child: stem + rail + drops (simpler than left/right branch approach)"
  - "SpouseConnector height prop with line at height/2 for vertical centering"
  - "Ancestor branch gap 48px, couple gap 16px (was both 8px)"
  - "Dynamic minScale = min(viewportW/treeW, viewportH/treeH, 1) with 0.3 fallback"

patterns-established:
  - "Gesture.Simultaneous for composing pan + pinch on scrollable content"
  - "onLayout measurement for dynamic gesture constraints"

# Metrics
duration: 3min
completed: 2026-02-06
---

# Quick 001: Fix Tree Connector Bugs + Grandparent Spacing + Pinch-to-Zoom Summary

**Rewrote FamilyConnector SVG to stem+rail+drops, added height-aware SpouseConnector, widened grandparent spacing to 48px, replaced PanResponder with gesture-handler pan+pinch**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-06T17:30:42Z
- **Completed:** 2026-02-06T17:33:30Z
- **Tasks:** 2 (+ 1 checkpoint skipped per instructions)
- **Files modified:** 3

## Accomplishments
- FamilyConnector now draws a vertical stem, horizontal rail, and vertical drop for every child -- no more missing branches when children cluster near center
- SpouseConnector between ancestor branches renders a horizontal line at the vertical center of a 100px SVG, aligning with parent TreeNode centers
- Grandparent branches spaced 48px apart (was 8px); spouse connectors within couples widened to 16px
- PanResponder completely replaced with react-native-gesture-handler Gesture.Pan + Gesture.Pinch composed via Gesture.Simultaneous
- Pinch-to-zoom with dynamic min-scale (computed from viewport/tree layout) and max 2x

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix connector bugs (FamilyConnector SVG, SpouseConnector visibility, grandparent spacing)** - `7f88b07` (fix)
2. **Task 2: Replace PanResponder with gesture-handler pan + pinch-to-zoom** - `e30c6ef` (feat)

## Files Created/Modified
- `app/(tabs)/tree.tsx` - Tree screen: replaced PanResponder with gesture-handler pan+pinch, updated spacing constants, added viewport/tree layout measurement
- `src/components/tree/VineConnector.tsx` - FamilyConnector rewritten to stem+rail+drops; SpouseConnector accepts optional height prop
- `src/components/tree/FamilyUnitNode.tsx` - SPOUSE_GAP increased from 8px to 16px

## Decisions Made
- Simplified FamilyConnector multi-child SVG from left-branch/right-branch approach to stem+rail+drops -- more robust when children cluster near couple center
- SpouseConnector height prop defaults to STROKE_WIDTH for backward compatibility; only the ancestor-branch connector passes height={100}
- Used `Gesture.Simultaneous` (not `Gesture.Race`) so pan and pinch can happen concurrently
- minScale computed as `Math.min(viewportW/treeW, viewportH/treeH, 1) || 0.3` -- the `|| 0.3` fallback handles first render before layout measurement

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Tree screen visual bugs fixed, ready for visual verification on iOS simulator
- Gesture system ready for Phase 4 (Tree Interactions) which may add tap-to-center or double-tap zoom
- GestureHandlerRootView already wraps the app in _layout.tsx

---
*Plan: quick-001*
*Completed: 2026-02-06*
