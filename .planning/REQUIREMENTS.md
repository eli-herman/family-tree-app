# Requirements: The Vine MVP Stabilization

**Defined:** 2026-02-02
**Core Value:** Families can view, interact with, and navigate their family connections without bugs or broken flows.

## v1 Requirements

Requirements for MVP stabilization. Each maps to roadmap phases.

### Paywall

- [ ] **PAY-01**: Paywall screen has correct spacing and layout
- [ ] **PAY-02**: All tier cards display properly without overlap
- [ ] **PAY-03**: Buttons are properly spaced and tappable

### Member Profiles

- [ ] **PROF-01**: Tapping any family member opens profile modal
- [ ] **PROF-02**: Profile displays member name and avatar
- [ ] **PROF-03**: Profile displays relationship to current user
- [ ] **PROF-04**: Profile displays birthday (if available)
- [ ] **PROF-05**: Profile displays bio (if available)
- [ ] **PROF-06**: Profile displays family connections (parents, spouse, children, siblings)
- [ ] **PROF-07**: Tapping a family connection opens that member's profile
- [ ] **PROF-08**: Profile displays member's posts/memories
- [ ] **PROF-09**: Profile displays member's photos
- [ ] **PROF-10**: Close button dismisses modal and returns to previous screen

### Tree Interactions

- [ ] **TREE-01**: Every tree node is tappable
- [ ] **TREE-02**: Tree nodes show visual feedback on press
- [ ] **TREE-03**: Tapping tree node opens member profile modal

### Feed Interactions

- [ ] **FEED-01**: Heart reaction toggles on tap (already working)
- [ ] **FEED-02**: Heart count updates immediately
- [ ] **FEED-03**: Comment count displays on feed items
- [ ] **FEED-04**: Tapping comments expands to show comment list
- [ ] **FEED-05**: Comments display author avatar and name
- [ ] **FEED-06**: Share button opens share action (within family)

### Profile Settings

- [ ] **SETT-01**: Edit Profile navigates to edit form
- [ ] **SETT-02**: Edit form allows changing display name
- [ ] **SETT-03**: Edit form allows changing bio
- [ ] **SETT-04**: Subscription navigates to paywall
- [ ] **SETT-05**: Notifications screen displays toggle switches
- [ ] **SETT-06**: Privacy screen displays privacy options
- [ ] **SETT-07**: Help screen displays FAQ/support info
- [ ] **SETT-08**: About screen displays app version and credits
- [ ] **SETT-09**: Logout shows confirmation dialog
- [ ] **SETT-10**: Confirming logout clears session and shows logged-out state

### Data Flow

- [ ] **DATA-01**: Family store initialized with mock data
- [ ] **DATA-02**: Feed store initialized with mock data
- [ ] **DATA-03**: All screens read from stores (not local state)
- [ ] **DATA-04**: Store actions update UI immediately

### Cross-Platform

- [ ] **PLAT-01**: All features work in iOS Simulator
- [ ] **PLAT-02**: All features work in Android Emulator
- [ ] **PLAT-03**: No crashes or unhandled errors

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Backend Integration

- **BACK-01**: Firebase authentication replaces mock user
- **BACK-02**: Firestore replaces mock data
- **BACK-03**: Cloud Storage for photo uploads
- **BACK-04**: RevenueCat processes real purchases

### Comments (Full)

- **COMM-01**: User can add new comments
- **COMM-02**: Comments persist to backend
- **COMM-03**: Real-time comment updates

## Out of Scope

Explicitly excluded from MVP stabilization.

| Feature | Reason |
|---------|--------|
| Real authentication | Mock user sufficient for MVP testing |
| Firebase data | Mock data validates UI before backend |
| Real purchases | App Store setup not ready |
| Audio/video memories | Paid tier feature |
| Push notifications | Requires backend |
| Adding new family members | Requires backend persistence |
| Photo uploads | Requires Cloud Storage |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| PAY-01 | Phase 2 | Pending |
| PAY-02 | Phase 2 | Pending |
| PAY-03 | Phase 2 | Pending |
| PROF-01 | Phase 3 | Pending |
| PROF-02 | Phase 3 | Pending |
| PROF-03 | Phase 3 | Pending |
| PROF-04 | Phase 3 | Pending |
| PROF-05 | Phase 3 | Pending |
| PROF-06 | Phase 3 | Pending |
| PROF-07 | Phase 3 | Pending |
| PROF-08 | Phase 3 | Pending |
| PROF-09 | Phase 3 | Pending |
| PROF-10 | Phase 3 | Pending |
| TREE-01 | Phase 4 | Pending |
| TREE-02 | Phase 4 | Pending |
| TREE-03 | Phase 4 | Pending |
| FEED-01 | Phase 5 | Pending |
| FEED-02 | Phase 5 | Pending |
| FEED-03 | Phase 5 | Pending |
| FEED-04 | Phase 5 | Pending |
| FEED-05 | Phase 5 | Pending |
| FEED-06 | Phase 5 | Pending |
| SETT-01 | Phase 6 | Pending |
| SETT-02 | Phase 6 | Pending |
| SETT-03 | Phase 6 | Pending |
| SETT-04 | Phase 6 | Pending |
| SETT-05 | Phase 7 | Pending |
| SETT-06 | Phase 7 | Pending |
| SETT-07 | Phase 7 | Pending |
| SETT-08 | Phase 7 | Pending |
| SETT-09 | Phase 7 | Pending |
| SETT-10 | Phase 7 | Pending |
| PLAT-01 | Phase 8 | Pending |
| PLAT-02 | Phase 8 | Pending |
| PLAT-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after initial definition*
