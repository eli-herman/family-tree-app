# The Vine

## What This Is

The Vine is a private Christian family connection app for preserving memories, strengthening bonds, and sharing faith across generations. Built with React Native (Expo) + Firebase, it features a family updates feed, visual family tree, daily Bible verses, and heart reactions.

## Core Value

**A private, faith-centered space where families stay connected across generations.** Every feature serves the mission of bringing families closer through shared memories, daily devotion, and intuitive family tree visualization.

## Current State

**Shipped:** v0.1 MVP Stabilization (2026-02-15)
**Current milestone:** v1.0 (in progress)

### Validated Capabilities (from v0.1)

- ✓ Tab navigation (Feed, Tree, Profile) — Expo Router
- ✓ Daily Bible verse display with curated family-themed verses
- ✓ Family tree visualization with deterministic layout engine
- ✓ Single SVG overlay vine connectors (circuit-like aesthetic)
- ✓ Pinch-to-zoom and pan gestures on tree
- ✓ Tree auto-centers on current user, animates to new members
- ✓ Heart reactions on feed items with immediate state updates
- ✓ Zustand stores: familyStore, userStore, feedStore, authStore, subscriptionStore
- ✓ Firebase Auth (login, signup, forgot-password) with AuthGate
- ✓ Firestore-backed family units with typed child links
- ✓ Add member flow: spouse, parent, child, sibling
- ✓ Relationship derivation from family units (not stored on member docs)
- ✓ One partner at a time enforcement
- ✓ Member profile modal (basic — name, avatar, add-member actions)
- ✓ Design system (colors, typography, spacing, borderRadius)
- ✓ Accessibility labels/roles on all interactive controls
- ✓ ErrorBoundary with safe fallback UI
- ✓ Dev-only Firestore seed (mock data → Firestore on empty DB)
- ✓ CI/CD: GitHub Actions, ESLint, Prettier, Husky, Jest
- ✓ Subscription store with tier limits (UI only, no real purchases)
- ✓ Paywall screen structure (needs polish)

### Active (v1.0 Milestone)

Requirements defined in `.planning/REQUIREMENTS.md`

### Out of Scope

- Audio/video memories — paid tier feature, future milestone
- Push notifications — requires backend infrastructure
- Multi-family support — single family per account for now
- Web version — mobile-first, React Native only

## Context

**Tech stack:**

- React Native (Expo ~54.0.33) + TypeScript ~5.9.2
- Firebase (Auth + Firestore) — project exists, auth enabled
- Zustand for state management
- Expo Router for navigation
- React Native Reanimated + Gesture Handler for tree interactions

**Development team (3 agents):**

- **Claude** — Complex architecture, multi-file changes, debugging
- **Codex** — Isolated tasks via GitHub Issues (labeled `codex-task`), branch + PR workflow
- **Eli** — Beginner React tasks matched to Codedex course progress (learning components, props, JSX)

**Constraints:**

- Firebase Spark plan (free tier) — no Cloud Functions, limited storage
- RevenueCat account not yet created
- Apple Developer account not yet created
- Eli is learning React through Codedex — tasks should build on course progress

## Key Decisions

| Decision                             | Rationale                                            | Outcome           |
| ------------------------------------ | ---------------------------------------------------- | ----------------- |
| Deterministic tree layout            | Eliminates measurement-driven jitter                 | Validated         |
| Family units as canonical model      | Partners + typed child links in Firestore            | Validated         |
| Single SVG overlay connectors        | Cleaner than per-unit connectors                     | Validated         |
| Firebase Auth + AsyncStorage         | Hot-reload safe persistence                          | Validated         |
| Siblings derived from shared parents | Simplifies storage, prevents inconsistencies         | Validated         |
| One partner at a time                | Simplifies tree layout for v1                        | Active constraint |
| Three-agent workflow                 | Claude (complex) + Codex (isolated) + Eli (learning) | Active            |
| Milestone-based pace                 | Steady and thorough, not rushing                     | Active            |

---

_Last updated: 2026-02-15 after v0.1 archival_
