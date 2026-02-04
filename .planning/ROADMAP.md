# Roadmap: The Vine MVP Stabilization

**Created:** 2026-02-02
**Milestone:** v1.0 MVP Stabilization
**Total Phases:** 8
**Total Requirements:** 37

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Data Foundation | Stores wired with mock data | DATA-01 to DATA-04 | 4 |
| 2 | Paywall Polish | Fix layout issues | PAY-01 to PAY-03 | 3 |
| 3 | Member Profile Modal | Full profile implementation | PROF-01 to PROF-10 | 5 |
| 4 | Tree Interactions | Nodes open profiles | TREE-01 to TREE-03 | 3 |
| 5 | Feed Interactions | Comments and sharing | FEED-01 to FEED-06 | 4 |
| 6 | Settings Screens | All settings functional | SETT-01 to SETT-04 | 4 |
| 7 | Settings Screens (cont.) | Remaining settings | SETT-05 to SETT-10 | 4 |
| 8 | Cross-Platform Verification | Test iOS and Android | PLAT-01 to PLAT-03 | 3 |

---

## Phase 1: Data Foundation

**Goal:** Create family store and wire all mock data through Zustand stores so components have reliable data sources.

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Create Herman family mock data and relationship utilities
- [x] 01-02-PLAN.md — Create familyStore and userStore with async loading
- [x] 01-03-PLAN.md — Enhance feedStore with comments and selectors
- [x] 01-04-PLAN.md — Wire screens to stores and initialize on mount

**Requirements:**
- DATA-01: Family store initialized with mock data
- DATA-02: Feed store initialized with mock data
- DATA-03: All screens read from stores (not local state)
- DATA-04: Store actions update UI immediately

**Success Criteria:**
1. `useFamilyStore` exists with `members` array from mockData
2. `useFamilyStore.getMemberById(id)` returns correct member
3. `useFeedStore` returns feed items with author info
4. Modifying store state triggers component re-render

**Why first:** Everything else depends on data flowing correctly.

---

## Phase 2: Paywall Polish

**Goal:** Fix spacing and layout issues on paywall screen so it displays correctly on all devices.

**Requirements:**
- PAY-01: Paywall screen has correct spacing and layout
- PAY-02: All tier cards display properly without overlap
- PAY-03: Buttons are properly spaced and tappable

**Success Criteria:**
1. Tier comparison cards have consistent spacing
2. No content overlap or clipping
3. All buttons have adequate touch targets (44pt minimum)

**Why now:** Quick visual win, builds momentum.

---

## Phase 3: Member Profile Modal

**Goal:** Implement full member profile modal that displays all member information and family connections.

**Requirements:**
- PROF-01: Tapping any family member opens profile modal
- PROF-02: Profile displays member name and avatar
- PROF-03: Profile displays relationship to current user
- PROF-04: Profile displays birthday (if available)
- PROF-05: Profile displays bio (if available)
- PROF-06: Profile displays family connections
- PROF-07: Tapping a family connection opens that member's profile
- PROF-08: Profile displays member's posts/memories
- PROF-09: Profile displays member's photos
- PROF-10: Close button dismisses modal

**Success Criteria:**
1. Modal slides up from bottom when member tapped
2. All member info sections render with mock data
3. Family connections section shows related members as tappable items
4. Tapping connection navigates to that member's profile
5. Close button returns to previous screen

**Why now:** Core user experience, depends on data foundation.

---

## Phase 4: Tree Interactions

**Goal:** Wire all tree nodes to open member profiles on tap with visual feedback.

**Requirements:**
- TREE-01: Every tree node is tappable
- TREE-02: Tree nodes show visual feedback on press
- TREE-03: Tapping tree node opens member profile modal

**Success Criteria:**
1. All TreeNode components have onPress handlers
2. Press state shows opacity change or scale feedback
3. Tap navigates to `/member/[id]` with correct ID

**Why now:** Connects tree view to profile modal.

---

## Phase 5: Feed Interactions

**Goal:** Complete feed interactions with comments (view only) and sharing.

**Requirements:**
- FEED-01: Heart reaction toggles on tap (verify working)
- FEED-02: Heart count updates immediately (verify working)
- FEED-03: Comment count displays on feed items
- FEED-04: Tapping comments expands to show comment list
- FEED-05: Comments display author avatar and name
- FEED-06: Share button opens share action

**Success Criteria:**
1. Heart reactions work with immediate feedback
2. Comment count badge shows on items with comments
3. Tapping comment icon expands inline comment list
4. Each comment shows avatar, name, and text
5. Share button triggers React Native Share API

**Why now:** Completes feed experience, can parallel with settings.

---

## Phase 6: Settings Screens (Part 1)

**Goal:** Implement Edit Profile and core settings navigation.

**Requirements:**
- SETT-01: Edit Profile navigates to edit form
- SETT-02: Edit form allows changing display name
- SETT-03: Edit form allows changing bio
- SETT-04: Subscription navigates to paywall

**Success Criteria:**
1. Edit Profile button opens edit form screen
2. Form shows current name/bio from mock user
3. Changes update local state (mock persistence)
4. Save returns to profile with updated info
5. Subscription button opens paywall modal

**Why now:** Core profile actions.

---

## Phase 7: Settings Screens (Part 2)

**Goal:** Implement remaining settings screens.

**Requirements:**
- SETT-05: Notifications screen displays toggle switches
- SETT-06: Privacy screen displays privacy options
- SETT-07: Help screen displays FAQ/support info
- SETT-08: About screen displays app version and credits
- SETT-09: Logout shows confirmation dialog
- SETT-10: Confirming logout clears session

**Success Criteria:**
1. Notifications screen has working toggle switches
2. Privacy screen has toggle/selection options
3. Help screen shows FAQ content
4. About screen shows version from app.json
5. Logout shows Alert confirmation
6. Confirming logout navigates to logged-out state

**Why now:** Completes settings, lower priority than core features.

---

## Phase 8: Cross-Platform Verification

**Goal:** Verify all features work on both iOS Simulator and Android Emulator with no crashes.

**Requirements:**
- PLAT-01: All features work in iOS Simulator
- PLAT-02: All features work in Android Emulator
- PLAT-03: No crashes or unhandled errors

**Success Criteria:**
1. Complete user flow tested on iOS: Feed → Tree → Profile → Settings
2. Complete user flow tested on Android: Feed → Tree → Profile → Settings
3. All modals present correctly on both platforms
4. No red error screens or unhandled exceptions

**Why last:** Verification after all features implemented.

---

## Dependency Graph

```
Phase 1 (Data Foundation)
    ↓
Phase 2 (Paywall) ←── can parallel with Phase 1
    ↓
Phase 3 (Member Profile) ←── depends on Phase 1
    ↓
Phase 4 (Tree) ←── depends on Phase 3
    ↓
Phase 5 (Feed) ←── depends on Phase 1, can parallel with 4
    ↓
Phase 6 (Settings 1) ←── can parallel with 4, 5
    ↓
Phase 7 (Settings 2) ←── depends on Phase 6
    ↓
Phase 8 (Verification) ←── depends on all above
```

## Parallelization Opportunities

| Wave | Phases | Notes |
|------|--------|-------|
| Wave 1 | 1, 2 | Data foundation + Paywall (independent) |
| Wave 2 | 3 | Member profile (needs data) |
| Wave 3 | 4, 5, 6 | Tree, Feed, Settings Part 1 (can parallel) |
| Wave 4 | 7 | Settings Part 2 |
| Wave 5 | 8 | Final verification |

---
*Roadmap created: 2026-02-02*
*Last updated: 2026-02-04 — Phase 1 complete (4/4 plans)*
