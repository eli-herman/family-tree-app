# Research Summary: The Vine MVP Stabilization

**Domain:** React Native family connection app
**Researched:** 2026-02-02
**Overall confidence:** HIGH

## Executive Summary

The Vine has a solid foundation with Expo Router, Zustand, and a well-organized component structure. The stabilization work focuses on wiring existing pieces together rather than architectural changes.

The key patterns needed are: expo-router modal presentation for member profiles, Zustand store selectors for efficient data access, and consistent Pressable handlers for all interactive elements. The existing mock data utilities provide the data source — stores need to consume and expose this data to components.

The paywall spacing issues are likely caused by inconsistent spacing values or missing flex properties. Layout debugging with temporary borders will quickly identify the problem areas.

Most importantly: every button must do something. The app will feel complete when there are no dead-end taps — every interaction leads somewhere meaningful.

## Key Findings

**Stack:** Existing stack is correct. Focus on patterns (modal navigation, store selectors, Pressable handlers), not dependencies.

**Architecture:** Data flow should be: mockData → Zustand store → screen → component. Modal routes must be defined in root _layout.tsx with `presentation: 'modal'`.

**Critical pitfall:** Modal params undefined — always verify navigation calls include actual IDs, not route patterns.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Fix Paywall Layout** - Quick win, visual polish
   - Addresses: Spacing issues
   - Low risk, isolated change

2. **Create Family Store** - Foundation for member features
   - Addresses: Data flow architecture
   - Required before member profiles work

3. **Implement Member Modal** - Core user experience
   - Addresses: Profile viewing, family connections
   - Depends on: Family store

4. **Wire Tree Interactions** - Connect tree to profiles
   - Addresses: Tree node taps → member modal
   - Depends on: Member modal working

5. **Wire Feed Interactions** - Complete feed experience
   - Addresses: Comments, sharing (hearts already work)
   - Can parallel with tree work

6. **Wire Profile Settings** - Complete settings menu
   - Addresses: All settings buttons functional
   - Can parallel with feed work

7. **End-to-End Testing** - Verify all paths
   - Addresses: Bug hunting, edge cases
   - Final phase

**Phase ordering rationale:**
- Paywall first: quick visual win, builds momentum
- Store before UI: data must flow before features work
- Modal before integrations: core experience must work before connecting touchpoints

**Research flags for phases:**
- Phase 3 (Member Modal): Watch for params undefined pitfall
- Phase 4 (Tree): Watch for Pressable not responding pitfall

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing stack verified, patterns documented |
| Features | HIGH | Standard mobile app patterns |
| Architecture | HIGH | expo-router + Zustand well documented |
| Pitfalls | MEDIUM | Based on common RN issues, may encounter others |

## Gaps to Address

- Exact mock data structure needs verification during implementation
- Settings sub-screens may need additional routes
- Comment functionality needs UI design decisions (inline vs modal)

---
*Research complete. Ready for requirements definition.*
