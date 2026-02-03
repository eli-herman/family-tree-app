---
phase: 01-data-foundation
plan: 01
subsystem: data
tags: [mock-data, relationships, typescript, family-tree]

# Dependency graph
requires: []
provides:
  - FamilyMember type with gender field
  - Herman family mock data (9 members)
  - calculateRelationship utility function
  - getSiblings helper function
affects: [familyStore, tree-layout, member-profile]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Store only parent/child/spouse relationships, derive siblings at runtime"
    - "Calculate relationship labels from current user's perspective"

key-files:
  created:
    - src/utils/relationships.ts
  modified:
    - src/types/user.ts
    - src/utils/mockData.ts

key-decisions:
  - "Siblings derived from shared parents, not stored directly"
  - "Gender field added as optional to FamilyMember type"

patterns-established:
  - "Relationship calculation via two-hop traversal for in-laws and grandparents"

# Metrics
duration: 3min
completed: 2026-02-03
---

# Phase 01 Plan 01: Herman Family Data Summary

**Herman family mock data with 9 members and relationship calculation utility that derives sibling/in-law/grandparent labels from stored parent/child/spouse relationships**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-03T15:56:36Z
- **Completed:** 2026-02-03T15:59:06Z
- **Tasks:** 3/3
- **Files modified:** 3

## Accomplishments

- Added optional `gender` field to FamilyMember type for gendered relationship labels
- Created Herman family mock data with 9 members across 3 generations
- Built `calculateRelationship()` function that correctly labels parent, sibling, in-law, and grandparent relationships
- Updated mockFeedItems to use Herman family member IDs

## Task Commits

Each task was committed atomically:

1. **Task 1: Update FamilyMember type with gender field** - `e012012` (feat)
2. **Task 2: Replace mock data with Herman family** - `596c479` (feat)
3. **Task 3: Create relationship calculation utility** - `51d5a62` (feat)

## Files Created/Modified

- `src/types/user.ts` - Added `gender?: 'male' | 'female'` to FamilyMember interface
- `src/utils/mockData.ts` - Herman family data (9 members) and updated feed items (8 items)
- `src/utils/relationships.ts` - New file with `calculateRelationship()` and `getSiblings()` functions

## Decisions Made

- **Sibling relationships derived, not stored:** Siblings are calculated at runtime by finding members who share at least one parent. This simplifies data storage and prevents inconsistencies.
- **Gender field is optional:** Allows graceful handling of members without gender specified (defaults to neutral terms like "Your Spouse")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data foundation complete for familyStore implementation
- Relationship calculator ready for use in member profiles and tree views
- Mock data provides realistic testing scenarios with 3 generations

---
*Phase: 01-data-foundation*
*Completed: 2026-02-03*
