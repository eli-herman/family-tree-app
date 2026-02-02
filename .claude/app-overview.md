# The Vine - App Overview

## What is The Vine?

The Vine is a private Christian family connection app that helps families:
- Stay connected through shared updates and memories
- Visualize their family relationships through an interactive tree
- Strengthen faith bonds through daily Bible verses
- Preserve family history for future generations

**Biblical Foundation:** "I am the vine; you are the branches." — John 15:5

## Core Features

### 1. Updates Feed
The primary daily surface showing:
- **Daily Bible Verse** - Curated verses about family, love, unity, and faith
- Family activity updates ("Mom added a photo", "Grandpa shared a memory")
- Simple heart reactions
- Story prompts to inspire sharing

### 2. Family Tree
A visual, interactive family tree with:
- Thin, circuit-like vine connections (1.5px)
- Scalable nodes (normal → small → tiny as family grows)
- Avatar initials with colored backgrounds
- Tap to view member profiles

### 3. Profile Pages
Individual pages for each family member containing:
- Basic info and bio
- Photos and memories
- Optional audio recordings
- Gradual profile building over time

### 4. Daily Verse
Bible verses rotating daily with themes:
- Family, Love, Unity, Parenting, Marriage, Faith, Gratitude

## Design Philosophy

### Visual Identity
- **Colors:** Forest greens, warm browns, cream backgrounds
- **Connections:** Thin vine-like lines (organic but clean)
- **Feel:** Natural, warm, faith-affirming

### UX Principles
- No pressure to post or complete profiles
- Browse-only users still get value
- Faith integrated naturally, never forced
- Works even with minimal family participation

## Technical Architecture

```
React Native (Expo)
├── Expo Router (file-based navigation)
├── Firebase (auth, database, storage)
├── Zustand (state management)
└── TypeScript throughout
```

### Key Directories
- `app/` - Screens and navigation (Expo Router)
- `src/components/` - Reusable UI components
- `src/constants/` - Design system (colors, typography)
- `src/services/` - Firebase configuration
- `src/stores/` - Zustand state stores
- `src/utils/` - Helpers and daily verses

## Bundle Identifier
- iOS: `com.eliherman.thevine`
- Android: `com.eliherman.thevine`

---
*Last updated: 2026-02-01*
