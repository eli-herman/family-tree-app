# The Vine - MVP Stabilization

## What This Is

The Vine is a private Christian family connection app for preserving memories, strengthening bonds, and sharing faith across generations. Built with React Native (Expo) + Firebase, it features a family updates feed, visual family tree, daily Bible verses, and heart reactions. This milestone focuses on stabilizing the MVP — making all free tier features work correctly with mock data in iOS/Android simulators.

## Core Value

**Families can view, interact with, and navigate their family connections without bugs or broken flows.** Every tap should do something meaningful. Every screen should be reachable and functional.

## Requirements

### Validated

- ✓ Tab navigation (Feed, Tree, Profile) — existing
- ✓ Daily Bible verse display — existing
- ✓ Basic family tree visualization with vine connectors — existing
- ✓ Heart reactions on feed items — existing
- ✓ Subscription store with tier limits — existing
- ✓ Paywall screen structure — existing
- ✓ Design system (colors, typography, spacing) — existing
- ✓ Mock data utilities — existing

### Active

- [ ] Fix paywall.tsx spacing issues
- [ ] Family member tap → profile modal with full info
- [ ] Member profile displays: name, photo, relationship, birthday, family connections, stories, pictures
- [ ] Navigation buttons work throughout app
- [ ] Feed actions: hearts (working), comments (placeholder → functional), sharing
- [ ] Profile actions: edit profile, settings menu items, logout
- [ ] Tree interactions: tap any family member to view profile
- [ ] All screens render correctly in iOS/Android simulators
- [ ] Mock data flows through entire app without errors

### Out of Scope

- Firebase backend integration — mock data only for now
- RevenueCat purchases — UI only, no real transactions
- Audio/video memories — paid tier feature, not in free plan
- Real authentication — mock user for development
- Push notifications — deferred to post-MVP

## Context

**Existing codebase state:**
- Expo Router navigation in place with tabs and modal routes
- Component library exists: Avatar, Button, Card, FeedItem, TreeNode, VineConnector
- Zustand stores: authStore, feedStore, subscriptionStore (all have structure but limited wiring)
- Many buttons are placeholders with no onPress handlers
- Member detail modal (`app/member/[id].tsx`) exists but needs full implementation
- Paywall has spacing/layout issues to fix

**Free tier limits (for reference):**
- 5 family members max
- 50 photos total
- Basic family tree
- Daily Bible verse
- Heart reactions

**Development environment:**
- Expo ~54.0.33, React Native 0.81.5, TypeScript ~5.9.2
- iOS Simulator and Android Emulator for testing
- No backend required — all mock data

## Constraints

- **Tech stack**: React Native (Expo) + TypeScript — already established
- **Data source**: Mock data only — no Firebase calls
- **Scope**: Free tier features only — no premium features
- **Platform**: Must work in both iOS and Android simulators
- **No new dependencies**: Use existing packages where possible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mock data only | Decouple UI stabilization from backend complexity | — Pending |
| Free tier scope | Ship core experience before adding premium features | — Pending |
| Fix before adding | Stabilize existing code rather than building new features | — Pending |

---
*Last updated: 2026-02-02 after initialization*
