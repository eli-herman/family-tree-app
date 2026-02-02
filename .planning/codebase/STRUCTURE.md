# STRUCTURE

## Overview

The Vine follows a **layered, feature-grouped architecture** optimized for a React Native Expo app. The root contains Expo configuration and package management. The `app/` directory houses Expo Router screens organized by navigation structure. The `src/` directory contains all reusable logic: components grouped by feature domain, centralized state stores, type definitions, services, constants, and utilities. This structure scales well as the app grows, keeping related code together and separating concerns.

---

## Details

### Root Directory Structure

```
/family-tree-app/
├── app/                          # Expo Router screens (navigation structure)
├── src/                          # Application logic and components
├── assets/                       # Static images, fonts, icons
├── docs/                         # Project documentation
├── .planning/                    # Planning and architecture docs
├── .expo/                        # Expo configuration (generated)
├── .claude/                      # Claude context files (PRD, changelog, etc.)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── app.json                      # Expo app manifest (name, version, plugins)
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies, scripts
├── package-lock.json             # Dependency lock file
└── CLAUDE.md                     # Claude context summary
```

### `app/` - Navigation & Screens (Expo Router)

Expo Router uses file-based routing. The directory structure mirrors navigation:

```
app/
├── _layout.tsx                   # Root layout wrapper
│                                 # - GestureHandlerRootView
│                                 # - SafeAreaProvider
│                                 # - Stack navigation config
│                                 # - Routes: (tabs), member/[id]
│
├── (tabs)/                       # Route group for tab navigation
│   ├── _layout.tsx              # Tab bar configuration
│   │                             # - Tab icons (SVG-based)
│   │                             # - Styling (colors, heights)
│   │                             # - Active/inactive colors
│   │
│   ├── index.tsx                # Feed screen (home tab)
│   │                             # - FlatList with feed items
│   │                             # - DailyVerse component
│   │                             # - PromptCard footer
│   │                             # - Heart reactions
│   │
│   ├── tree.tsx                 # Family Tree screen
│   │                             # - Scrollable tree visualization
│   │                             # - Generations: grandparents → parents → children
│   │                             # - Dynamic vine connectors
│   │                             # - Node scaling based on generation size
│   │
│   └── profile.tsx              # Profile screen
│                                 # - User avatar and bio
│                                 # - Statistics (members, memories)
│                                 # - Settings menu
│                                 # - Logout button
│
├── member/[id].tsx              # Dynamic member detail modal
│                                 # - Receives id from route params
│                                 # - Modal presentation style
│                                 # - Member info, photos, relationships
│
└── paywall.tsx                  # Subscription tier selection screen
                                  # - Feature comparison table
                                  # - RevenueCat integration
                                  # - Purchase flow
```

**Routing Conventions:**
- `(tabs)` uses route groups for co-located tab screens
- `member/[id]` uses dynamic routing for member detail modal
- `_layout.tsx` files define navigation structure at each level
- Screen filenames match route names (index.tsx = default screen)

### `src/` - Application Logic

```
src/
├── components/                   # Reusable UI components (organized by feature)
│
├── ├── common/                   # UI primitives (used everywhere)
│ │   ├── index.ts               # Barrel export
│ │   ├── Avatar.tsx             # Circular initials avatar
│ │   │                           # Props: name, size, variant
│ │   │                           # Sizes: sm, md, lg, xl
│ │   │                           # Variants: green, brown, branch
│ │   │
│ │   ├── Button.tsx             # Reusable button component
│ │   │                           # Props: title, onPress, variant, size, disabled, loading
│ │   │                           # Variants: primary, secondary, outline, ghost
│ │   │                           # Sizes: sm, md, lg
│ │   │
│ │   ├── Card.tsx               # Container component with shadow/styling
│ │   │                           # Props: children, variant, style
│ │   │                           # Variants: filled, outlined
│ │   │
│ │   ├── FeatureGate.tsx         # Conditional feature access
│ │   │                           # Props: feature, tier, children, fallback
│ │   │                           # Gating logic from subscriptionStore
│ │   │
│ │   └── UpgradeBanner.tsx       # Upgrade prompt for free users
│ │                               # Props: feature, onUpgrade
│ │
│ ├── feed/                       # Feed feature components
│ │   ├── index.ts               # Barrel export
│ │   ├── FeedItem.tsx           # Individual feed entry
│ │   │                           # Props: item, onHeart, currentUserId
│ │   │                           # Shows: author, action, timestamp, media, hearts
│ │   │
│ │   ├── PromptCard.tsx         # Story prompt card
│ │   │                           # Props: prompt, onRespond
│ │   │                           # Encourages memory sharing
│ │   │
│ │   └── DailyVerse.tsx         # Daily Scripture passage
│ │                               # Props: verse
│ │                               # Displays: text, reference, book
│ │
│ ├── tree/                       # Family tree components
│ │   ├── index.ts               # Barrel export
│ │   ├── TreeNode.tsx           # Family member node card
│ │   │                           # Props: member, onPress, isSelected, variant, scale
│ │   │                           # Variants: green, brown, branch (colors)
│ │   │                           # Scales: normal, small, tiny (responsive)
│ │   │
│ │   ├── VineConnector.tsx       # Generation connector (SVG)
│ │   │                           # Props: childCount, nodeWidth, gap, dropHeight, riseHeight
│ │   │                           # Renders: Circuit-like vine connections
│ │   │
│ │   └── SpouseConnector.tsx     # Spouse horizontal connector
│ │                               # Props: width
│ │
│ └── profile/                    # Profile feature components
│     ├── index.ts               # Barrel export
│     └── ProfileHeader.tsx       # User profile card
│                                 # Props: user
│                                 # Shows: avatar, name, bio, edit button
│
├── stores/                       # Zustand state management
│   ├── index.ts                 # Barrel export of all stores
│   │
│   ├── authStore.ts             # Authentication state
│   │                             # State: user, isAuthenticated, isLoading
│   │                             # Actions: setUser, setLoading, logout
│   │
│   ├── feedStore.ts             # Feed data state
│   │                             # State: items[], isLoading
│   │                             # Actions: setItems, addItem, updateItem, removeItem, toggleHeart
│   │                             # Data: FeedItem[] with author, content, hearts
│   │
│   └── subscriptionStore.ts     # Subscription & feature gating
│                                 # State: tier, isActive, expiresAt, provider, productId
│                                 # Actions: setSubscription, resetSubscription
│                                 # Features: canAddMember, canUploadPhoto, canRecordAudio, canRecordVideo, canArchiveDeceased, canExport
│                                 # Getters: getMemberLimit, getPhotoLimit, getRemainingMembers, getRemainingPhotos
│                                 # Data: TIER_LIMITS mapping each tier to capabilities
│
├── types/                        # TypeScript type definitions (organized by domain)
│   ├── index.ts                 # Barrel export
│   │
│   ├── user.ts                  # User & family domain types
│   │                             # - User: id, email, displayName, photoURL, timestamps
│   │                             # - FamilyMember: id, firstName, lastName, nickname, photoURL, birthDate, deathDate, bio, relationships
│   │                             # - Relationship: memberId, type
│   │                             # - RelationshipType: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild'
│   │
│   ├── feed.ts                  # Feed domain types
│   │                             # - FeedItem: id, type, authorId, authorName, content, hearts[], timestamps
│   │                             # - FeedItemType: 'photo' | 'memory' | 'milestone' | 'prompt_response'
│   │                             # - FeedContent: text, mediaURLs, promptId, promptText
│   │                             # - Prompt: id, text, category, isActive
│   │                             # - PromptCategory: 'childhood' | 'family_traditions' | 'life_lessons' | 'relationships' | 'milestones' | 'daily_life'
│   │
│   ├── subscription.ts          # Subscription domain types
│   │                             # - SubscriptionTier: 'free' | 'family' | 'legacy'
│   │                             # - SubscriptionInfo: tier, isActive, expiresAt, provider, productId
│   │                             # - TierLimits: maxMembers, maxPhotos, can/[Feature], export
│   │                             # - TIER_LIMITS: Record<tier, TierLimits> (source of truth)
│   │                             # - SubscriptionProduct: id, tier, name, price, period, savings
│   │                             # - PRODUCTS: Array of tier product definitions
│   │
│   └── verse.ts                 # Scripture domain types
│                                 # - Verse: text, reference, book
│
├── services/                     # External service integrations
│   ├── firebase.ts              # Firebase configuration
│   │                             # Exports: app, auth, db, storage
│   │                             # Initialization: getApps() pattern for singleton
│   │                             # Persistence: AsyncStorage for auth
│   │                             # Config: Environment variables from .env
│   │
│   └── purchases.ts             # RevenueCat subscription service
│                                 # Exports: initializePurchases, getSubscriptionInfo, getOfferings, purchasePackage, restorePurchases, parseCustomerInfo, getTierFromProductId
│                                 # Entitlements: 'family', 'legacy'
│                                 # Stores: Apple App Store, Google Play Store detection
│                                 # Config: API keys from .env
│
├── constants/                    # Design system and configuration
│   ├── index.ts                 # Barrel export (colors, typography, spacing)
│   │
│   ├── colors.ts                # Color palette
│   │                             # Primary: Forest greens (light, main, dark)
│   │                             # Accents: Browns (light, main, branch for vines)
│   │                             # Backgrounds: Warm white, cream, light tan
│   │                             # Text: Primary, secondary, tertiary, inverse
│   │                             # Semantic: Heart, success, warning, error
│   │                             # Grays: 100-500 scale for subtle UI
│   │
│   ├── spacing.ts               # Spacing scale & border radius
│   │                             # Scale: xs (4) → sm (8) → md (16) → lg (24) → xl (32) → 2xl (48) → 3xl (64)
│   │                             # BorderRadius: sm (4) → md (8) → lg (12) → xl (16) → 2xl (24) → full (9999)
│   │
│   └── typography.ts            # Font system
│                                 # Families: System (iOS), Roboto (Android)
│                                 # Sizes: xs (12) → sm (14) → base (16) → lg (18) → xl (20) → 2xl (24) → 3xl (30) → 4xl (36)
│                                 # Weights: regular (400), medium (500), semibold (600), bold (700)
│                                 # LineHeights: tight (1.2), normal (1.5), relaxed (1.75)
│                                 # Styles: h1-h4, body, bodySmall, caption, button, buttonSmall
│
└── utils/                        # Utility functions & helpers
    ├── dailyVerses.ts           # Daily verse selection
    │                             # getDailyVerse(): Verse
    │                             # - Returns different verse each day (based on day of year)
    │                             # - Curated family/faith-themed Scripture passages
    │
    └── mockData.ts              # Mock data for development
                                  # Exports: mockFamilyMembers[], mockFeedItems[], mockPrompts[]
                                  # Usage: Testing without Firebase dependency
```

### File Organization Principles

**By Feature Domain:**
- `components/feed/` groups all feed-related components
- `components/tree/` groups all family tree components
- `components/profile/` groups all profile components
- Easy to locate related code, remove features without side effects

**By Technical Role:**
- `stores/` all state management in one place
- `types/` all type definitions in one place
- `services/` all external integrations in one place
- `constants/` all design system in one place
- Clear separation of concerns

**Naming Conventions:**

Component Files:
- PascalCase for component files: `Avatar.tsx`, `FeedItem.tsx`, `TreeNode.tsx`
- Lowercase for hook files: `useFeedStore.ts`
- Index files: `index.ts` barrel exports

Store Files:
- Suffix: `Store.ts` pattern: `authStore.ts`, `feedStore.ts`, `subscriptionStore.ts`
- Exports: `useAuthStore`, `useFeedStore`, `useSubscriptionStore` (Zustand convention)

Type Files:
- Domain-based naming: `user.ts`, `feed.ts`, `subscription.ts`, `verse.ts`
- Index file: `index.ts` for barrel exports

Constants:
- Lowercase: `colors.ts`, `typography.ts`, `spacing.ts`
- Exported as objects: `colors`, `typography`, `spacing`

Routes:
- Dynamic routes in brackets: `member/[id].tsx`
- Grouped routes in parentheses: `(tabs)/`
- Underscores for layout: `_layout.tsx`

### Import Path Patterns

**Absolute Imports (via Expo base config):**
```typescript
// From app/ screens
import { FeedItem } from '../../src/components/feed';
import { colors, spacing } from '../../src/constants';
import { useFeedStore } from '../../src/stores';

// From src/ components
import { Button } from '../common';
import { FeedItemType } from '../types';
```

**Barrel Exports for Convenience:**
```typescript
// src/stores/index.ts exports all stores
import { useAuthStore, useFeedStore, useSubscriptionStore } from '../../src/stores';

// src/types/index.ts exports all types
import { User, FeedItem, Prompt } from '../../src/types';

// src/components/*/index.ts exports component groups
import { FeedItem, PromptCard, DailyVerse } from '../../src/components/feed';
```

### Dependencies Location

**Configuration Files:**
- `app.json` - Expo manifest (app name, version, plugins, splash, icons)
- `tsconfig.json` - TypeScript compiler options (strict mode enabled)
- `package.json` - Dependencies and scripts
- `.env.example` - Template for environment variables (Firebase, RevenueCat keys)

**Dependencies by Category:**

*React & Navigation:*
- `react`: Core React library
- `react-native`: Native framework
- `expo`: Expo platform
- `expo-router`: File-based routing (navigation)
- `@react-navigation/*`: Navigation primitives

*UI & Styling:*
- `react-native-safe-area-context`: Safe area handling
- `react-native-svg`: SVG support for custom icons/vines
- `expo-image`: Image loading

*State & Storage:*
- `zustand`: Lightweight state management
- `react-native-mmkv`: Fast key-value storage
- `@react-native-async-storage/async-storage`: Persistent storage

*Backend & Services:*
- `firebase`: Authentication, Firestore, Cloud Storage
- `react-native-purchases`: RevenueCat SDK (in-app purchases)

*Utilities:*
- `date-fns`: Date formatting and manipulation
- `expo-constants`: App constants
- `expo-secure-store`: Encrypted storage for secrets

### Asset Organization

```
assets/
├── fonts/                       # Custom font files (if added)
├── images/                      # Image assets
├── icons/                       # SVG icons (could be used)
└── animations/                  # Animation files (future)
```

### Documentation Organization

```
.claude/                        # Claude-specific context
├── PRD.md                      # Product requirements
├── app-overview.md             # Feature overview
├── style-guide.md              # Code style conventions
├── packages.md                 # Dependency documentation
├── changelog.md                # Decision log
├── MONETIZATION-PLAN.md        # Subscription strategy
└── agents/                     # Multi-agent coordination
    ├── design-spec.md          # UI single source of truth
    ├── coordination.md         # Collaboration rules
    ├── status-board.md         # Agent status
    └── updates-log.md          # Recent changes

.planning/                      # Architecture & planning
├── codebase/
│   ├── ARCHITECTURE.md         # System design patterns
│   └── STRUCTURE.md            # Directory layout
└── (future: design decisions, roadmap)

docs/                          # Public project documentation
└── (future: user guides, deployment docs)
```

### Configuration & Environment

**Environment Variables** (from `.env.example`)
```
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
EXPO_PUBLIC_FIREBASE_APP_ID=xxx
```

**Build Configuration:**
- `app.json` defines splash screen, app icon, bundled asset paths
- `tsconfig.json` uses Expo's base config with strict TypeScript checking
- `package.json` scripts: `start`, `ios`, `android`, `web`

### Scale & Performance Considerations

**Component Architecture Scales:**
- Common components (Avatar, Button) are lightweight and reusable
- Domain-specific components keep logic co-located
- Avoid deeply nested imports; barrel exports flatten structure

**Store Architecture Scales:**
- Zustand stores are lightweight, suitable for modest global state
- Each store handles single domain (auth, feed, subscriptions)
- Adding stores is simple: create file, export hook, add to index

**Types Scale:**
- Domain-based files keep types organized
- Barrel export makes imports convenient
- Easy to add new domains without restructuring

---

## Key Files

### Navigation Structure
- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/tree.tsx`
- `app/(tabs)/profile.tsx`
- `app/member/[id].tsx`
- `app/paywall.tsx`

### Component Directory
- `src/components/common/` - Avatar, Button, Card, FeatureGate, UpgradeBanner
- `src/components/feed/` - FeedItem, PromptCard, DailyVerse
- `src/components/tree/` - TreeNode, VineConnector, SpouseConnector
- `src/components/profile/` - ProfileHeader

### State & Data
- `src/stores/authStore.ts`
- `src/stores/feedStore.ts`
- `src/stores/subscriptionStore.ts`
- `src/types/user.ts`
- `src/types/feed.ts`
- `src/types/subscription.ts`
- `src/types/verse.ts`

### Services & Constants
- `src/services/firebase.ts`
- `src/services/purchases.ts`
- `src/constants/colors.ts`
- `src/constants/spacing.ts`
- `src/constants/typography.ts`

### Configuration
- `app.json`
- `tsconfig.json`
- `package.json`
- `.env.example`
