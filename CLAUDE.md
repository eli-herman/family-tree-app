# The Vine - Claude Context

> This file is automatically read by Claude Code when working in this project.

## Quick Reference

- **App Name:** The Vine
- **Tagline:** "I am the vine; you are the branches" — John 15:5
- **App Purpose:** Private Christian family connection app - preserving memories, strengthening bonds, and sharing faith across generations
- **Developer:** Eli Herman
- **Status:** MVP Development
- **Stack:** React Native (Expo) + Firebase
- **Design:** Natural forest greens, warm creams, earthy browns

## Core Features

1. **Family Updates Feed** - Share photos, memories, and milestones
2. **Family Tree** - Visual tree with thin, circuit-like vine connections that scale with family size
3. **Daily Bible Verse** - Curated verses about family, love, unity, and faith
4. **Heart Reactions** - Simple way to show love on posts
5. **Story Prompts** - Thoughtful questions to inspire memory sharing

## Context Files

Read these files for detailed context:

1. **PRD:** `.claude/PRD.md` - **AUTHORITATIVE** product requirements document
2. **App Overview:** `.claude/app-overview.md` - What the app does, features, architecture
3. **Style Guide:** `.claude/style-guide.md` - Code style, naming conventions, preferences
4. **Packages:** `.claude/packages.md` - Dependencies, documentation links, version info
5. **Changelog:** `.claude/changelog.md` - Decisions made, learnings, updates
6. **Monetization Plan:** `.claude/MONETIZATION-PLAN.md` - **NEXT TO IMPLEMENT** - Subscription tiers, RevenueCat integration, feature gating

## Multi-Agent Coordination

When working as part of a multi-agent team, READ THESE FIRST:

1. **Design Spec:** `.claude/agents/design-spec.md` - SINGLE SOURCE OF TRUTH for all UI
2. **Coordination:** `.claude/agents/coordination.md` - Rules for agent collaboration
3. **Status Board:** `.claude/agents/status-board.md` - See what others are working on
4. **Updates Log:** `.claude/agents/updates-log.md` - Recent changes and decisions

**CRITICAL:** Update status-board.md BEFORE starting work and AFTER completing work.

## Working Guidelines

- Always read relevant context files before making architectural decisions
- Update `.claude/changelog.md` when significant decisions are made
- Follow the style guide for all code changes
- Ask clarifying questions rather than assuming

## Project Structure

```
app/                      # Expo Router screens
├── (tabs)/              # Tab navigation
│   ├── index.tsx        # Feed screen (with Daily Verse)
│   ├── tree.tsx         # Family Tree screen
│   └── profile.tsx      # Profile screen
└── member/[id].tsx      # Member detail modal

src/
├── components/          # UI components
│   ├── common/          # Avatar, Button, Card
│   ├── feed/            # FeedItem, PromptCard, DailyVerse
│   ├── tree/            # TreeNode, VineVertical, VineHorizontal
│   └── profile/         # ProfileHeader
├── constants/           # Design system (colors, typography, spacing)
├── services/            # Firebase configuration
├── stores/              # Zustand state management
├── types/               # TypeScript interfaces
└── utils/               # Mock data, daily verses
```

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Forest | #2D6A4F | Primary actions, buttons |
| Deep Forest | #1B4332 | Headers, emphasis |
| Light Green | #40916C | Secondary accents |
| Brown | #8B7355 | Avatar variants |
| Branch | #D4C4B0 | Vine connectors |
| Heart | #E07A5F | Reactions, logout |
| Warm White | #FEFDFB | Primary background |
| Cream | #F9F7F4 | Cards, secondary bg |

## Running the App

```bash
npm start        # Start Expo dev server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
```

## Current Focus

- [x] Define core features
- [x] Choose tech stack (React Native Expo + Firebase)
- [x] Set up project structure
- [x] Implement natural color palette
- [x] Add daily Bible verse feature
- [x] Create scalable tree nodes with thin vine connectors
- [ ] Create Firebase project and configure
- [ ] Implement authentication flow
- [ ] Connect screens to real Firebase data
