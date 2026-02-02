# ARCHITECTURE

## Overview

The Vine is a React Native mobile app built with Expo and Firebase for preserving family memories and connections. The architecture follows a modular, layered approach with clear separation of concerns: presentation layer (screens/components), business logic layer (stores), data models (types), and service layer (Firebase, RevenueCat).

The app uses **Expo Router** for navigation, **Zustand** for state management, **Firebase** for authentication and data persistence, and **RevenueCat** for in-app subscriptions. The design system is centralized in constants, ensuring visual consistency across all screens.

---

## Details

### Entry Points & Navigation

**Root Layout**: `app/_layout.tsx`
- Wraps entire app with `GestureHandlerRootView` and `SafeAreaProvider`
- Initializes Stack navigation with root-level routes
- Contains root modal screens: `member/[id]` (member details) and implicit tab navigation

**Tab Layout**: `app/(tabs)/_layout.tsx`
- Three main tabs: Feed, Tree, Profile
- Custom tab icons using SVG via `react-native-svg`
- Centralized tab styling with forest green theme colors
- Uses `Tabs` from `expo-router` for bottom tab bar navigation

### Screen Layer (app/)

- **Feed Screen** (`app/(tabs)/index.tsx`)
  - Primary hub displaying family updates, memories, and daily verses
  - Renders scrollable FlatList of feed items with header/footer
  - Integrates DailyVerse component and PromptCard
  - Local state for feed items using React hooks (will migrate to store)
  - Heart reaction handling with optimistic updates

- **Tree Screen** (`app/(tabs)/tree.tsx`)
  - Visual family tree with scalable node sizes based on generation count
  - Generations: Grandparents → Parents → Children (horizontal layout)
  - Dynamic vine connectors between generations
  - Responsive scaling: normal (2 members) → small (4 members) → tiny (5+ members)
  - Bidirectional scrolling (horizontal and vertical)
  - Selection state for highlighted member cards

- **Profile Screen** (`app/(tabs)/profile.tsx`)
  - Current user profile display with avatar and stats
  - Quick stats: Family Members count, Memories Shared count
  - Settings menu with links to: Subscription (paywall), Notifications, Privacy, Help, About
  - Logout button with heart color styling

- **Member Detail Modal** (`app/member/[id].tsx`)
  - Dynamic route parameter for member ID
  - Modal presentation (slides up from bottom)
  - Displays detailed member information, relationships, photos

- **Paywall Screen** (`app/paywall.tsx`)
  - Subscription tier display and purchasing flow
  - Integration point for RevenueCat purchase packages
  - Feature comparison between Free, Family, Legacy tiers

### Component Layer (src/components/)

#### Common Components (`src/components/common/`)
Reusable UI primitives following design system:

- **Avatar** (`Avatar.tsx`)
  - Circular initials-based avatar with color variants (green, brown, branch)
  - Sizes: sm (48px), md (64px), lg (80px), xl (96px)
  - Used throughout app for user/member identification

- **Button** (`Button.tsx`)
  - Variants: primary, secondary, outline, ghost
  - Sizes: sm, md, lg with responsive padding
  - Loading state with activity indicator
  - Disabled state styling
  - Consistent with design system typography

- **Card** (`Card.tsx`)
  - Container component with variants (filled, outlined)
  - Standard border radius and shadow
  - Padding built from spacing constants
  - Base component for feed items, stat cards

- **FeatureGate** (`FeatureGate.tsx`)
  - Conditional rendering based on subscription tier limits
  - Checks: canAddMember, canUploadPhoto, canRecordAudio, etc.
  - Shows upgrade banner or blocks interaction

- **UpgradeBanner** (`UpgradeBanner.tsx`)
  - Prompts free users to upgrade to Family/Legacy tiers
  - Surfaces blocked features

#### Feed Components (`src/components/feed/`)

- **FeedItem** (`FeedItem.tsx`)
  - Renders individual feed entries (photo, memory, milestone, prompt response)
  - Shows author avatar, action description, timestamp
  - Media placeholder with emoji icons
  - Heart reaction button with count badge
  - Local heart toggle state management

- **PromptCard** (`PromptCard.tsx`)
  - Displays daily story prompt for family members
  - Shows prompt text and respond button
  - Encourages memory sharing

- **DailyVerse** (`DailyVerse.tsx`)
  - Shows Scripture passage for the day
  - Pulls from rotated list of family-themed verses
  - Header component for feed screen

#### Tree Components (`src/components/tree/`)

- **TreeNode** (`TreeNode.tsx`)
  - Individual family member card in tree view
  - Responsive scaling based on `scale` prop (normal/small/tiny)
  - Color variants: green, brown, branch
  - Displays member name, nickname, relationship label
  - Avatar integration
  - Selection visual feedback (border color change)
  - Dynamic font sizing and padding based on scale

- **VineConnector** (`VineConnector.tsx`)
  - SVG-based connector between tree generations
  - Circuit-like aesthetic with thin lines
  - Dynamically routes multiple children to parent(s)
  - Animations/easing for smooth connections

- **SpouseConnector** (`src/components/tree/index.ts` export)
  - Thin horizontal connector between spouses in same generation

#### Profile Components (`src/components/profile/`)

- **ProfileHeader** (`ProfileHeader.tsx`)
  - User profile card with large avatar
  - Display name, nickname, bio
  - Edit profile button

### State Management Layer (src/stores/)

Uses **Zustand** for lightweight, TypeScript-first state management with no boilerplate.

**AuthStore** (`src/stores/authStore.ts`)
```
State: { user, isAuthenticated, isLoading }
Actions: setUser(user), setLoading(loading), logout()
Purpose: Global authentication state, user profile caching
```

**FeedStore** (`src/stores/feedStore.ts`)
```
State: { items: FeedItem[], isLoading }
Actions: setItems, addItem, updateItem, removeItem, toggleHeart
Purpose: Feed data caching, optimistic updates for reactions
Data Shape: Array of FeedItems with author info, content, hearts
```

**SubscriptionStore** (`src/stores/subscriptionStore.ts`)
```
State: { tier, isActive, expiresAt, provider, productId }
Actions: setSubscription, resetSubscription
Feature Checks: canAddMember(), canUploadPhoto(), canRecordAudio(), canRecordVideo(), canArchiveDeceased(), canExport()
Limit Getters: getMemberLimit(), getPhotoLimit(), getRemainingMembers(), getRemainingPhotos()
Purpose: Subscription status, feature gating logic, tier limits validation
```

**Store Index** (`src/stores/index.ts`)
- Barrel export of all stores for convenient importing

### Type System (src/types/)

Centralized TypeScript definitions for type safety:

**User Domain** (`src/types/user.ts`)
```
- User: id, email, displayName, photoURL, timestamps
- FamilyMember: id, firstName, lastName, nickname, photoURL, birthDate, deathDate, bio, relationships, createdBy, timestamps
- Relationship: memberId, type
- RelationshipType: 'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild'
```

**Feed Domain** (`src/types/feed.ts`)
```
- FeedItem: id, type, authorId, authorName, authorPhotoURL, content, hearts[], timestamps
- FeedItemType: 'photo' | 'memory' | 'milestone' | 'prompt_response'
- FeedContent: text, mediaURLs[], promptId, promptText
- Prompt: id, text, category, isActive
- PromptCategory: 'childhood' | 'family_traditions' | 'life_lessons' | 'relationships' | 'milestones' | 'daily_life'
```

**Subscription Domain** (`src/types/subscription.ts`)
```
- SubscriptionTier: 'free' | 'family' | 'legacy'
- SubscriptionInfo: tier, isActive, expiresAt, provider, productId
- TierLimits: maxMembers, maxPhotos, canRecordAudio, canRecordVideo, canArchiveDeceased, canExport
- TIER_LIMITS: Record mapping each tier to its feature/member/photo limits
- SubscriptionProduct: id, tier, name, price, period, savings
- PRODUCTS: Array of subscription product definitions
```

**Verse Domain** (`src/types/verse.ts`)
```
- Verse: text, reference, book
```

**Type Index** (`src/types/index.ts`)
- Barrel export of all type modules

### Services Layer (src/services/)

**Firebase Service** (`src/services/firebase.ts`)
```
Exports: app, auth, db, storage
Configuration: Uses environment variables for Firebase config
Initialization:
  - Initializes Firebase app (singleton pattern)
  - Sets up Authentication with AsyncStorage persistence
  - Initializes Firestore database
  - Initializes Cloud Storage
Persistence: AsyncStorage for auth persistence across app restarts
```

**Purchases Service** (`src/services/purchases.ts`)
```
Exports:
  - initializePurchases(userId?): Initialize RevenueCat SDK at app startup
  - getSubscriptionInfo(): Fetch current user's subscription tier
  - getOfferings(): Get available packages for purchase
  - purchasePackage(pkg): Execute purchase transaction
  - restorePurchases(): Restore previous purchases from app store
  - parseCustomerInfo(): Convert RevenueCat CustomerInfo to SubscriptionInfo
  - getTierFromProductId(): Map product ID to subscription tier

Entitlements: 'family' and 'legacy' (from RevenueCat dashboard)
Store Detection: Detects Apple App Store vs Google Play Store
Error Handling: Purchase cancellation detection, graceful error returns
```

### Constants Layer (src/constants/)

Centralized design system ensuring visual consistency:

**Colors** (`src/constants/colors.ts`)
```
Primary Greens: light (#40916C), main (#2D6A4F), dark (#1B4332)
Browns: light (#A69076), main (#8B7355), branch (#D4C4B0)
Backgrounds: primary (#FEFDFB), secondary (#F9F7F4), tertiary (#F0EDE8)
Text: primary (#1C1917), secondary (#57534E), tertiary (#A8A29E), inverse (#FFF)
Semantic: heart (#E07A5F), success (#40916C), warning (#E9C46A), error (#E07A5F)
Grays: 100-500 scale for borders and disabled states
```

**Spacing** (`src/constants/spacing.ts`)
```
Scale: xs (4), sm (8), md (16), lg (24), xl (32), 2xl (48), 3xl (64)
BorderRadius: sm (4), md (8), lg (12), xl (16), 2xl (24), full (9999)
```

**Typography** (`src/constants/typography.ts`)
```
Font Families: System (iOS), Roboto (Android)
Font Sizes: xs-4xl (12-36px)
Line Heights: tight (1.2), normal (1.5), relaxed (1.75)
Font Weights: regular (400), medium (500), semibold (600), bold (700)
Text Styles Pre-composed: h1-h4, body, bodySmall, caption, button, buttonSmall
```

**Barrel Export** (`src/constants/index.ts`)
- Re-exports colors, typography, spacing for easy importing

### Utilities (src/utils/)

**Daily Verses** (`src/utils/dailyVerses.ts`)
```
getDailyVerse(): Verse
- Returns different verse each day (based on day of year)
- Curated list of family/faith-themed Scripture passages
- Rotation ensures variety without repetition
```

**Mock Data** (`src/utils/mockData.ts`)
```
Exports:
- mockFamilyMembers: Array of FamilyMember objects with relationships
- mockFeedItems: Array of sample FeedItem entries
- mockPrompts: Array of story prompt suggestions
Purpose: Development/testing without Firebase dependency
```

### Data Flow & Patterns

**Feed Updates Flow:**
1. User taps heart on FeedItem
2. Component calls `onHeart(itemId)`
3. Screen handler updates local state (optimistic update)
4. Future: Action dispatched to feedStore
5. Future: Request sent to Firebase with conflict resolution
6. UI reflects immediate change, syncs with backend

**Family Tree Rendering Flow:**
1. Screen queries mockFamilyMembers (future: from store)
2. Members grouped into generations based on relationship types
3. Dynamic scaling calculated: scale depends on max generation size
4. Tree rendered top-to-bottom: Grandparents → Connector → Parents → Connector → Children
5. Vine connectors drawn between each generation layer
6. Selection state manages highlighted node

**Subscription Gating Flow:**
1. FeatureGate component checks subscription tier from subscriptionStore
2. Calls canAddMember() or canUploadPhoto() etc. from store
3. If false: Shows UpgradeBanner or disables interaction
4. User taps Upgrade → navigates to paywall
5. Paywall fetches packages from RevenueCat
6. User purchases → purchasePackage() called
7. customerInfo parsed → subscriptionStore updated
8. UI refreshes with new feature access

### Patterns & Abstractions

**Component Composition:**
- Small, focused components (Avatar, Button, Card) combined into larger features
- Feed/Tree/Profile domains have their own component subdirectories
- Common components are UI primitives, domain components handle data + UI

**State Management Strategy:**
- Zustand stores for global cross-screen state (Auth, Feed, Subscriptions)
- Local React.useState for UI-only state (selection, form inputs)
- No Redux, minimal boilerplate, easy to reason about

**Type Safety:**
- Full TypeScript with strict mode enabled
- Type-first data models in src/types
- No any types except where Firebase SDK requires workarounds

**Service Abstraction:**
- Firebase initialization isolated in services/firebase.ts
- RevenueCat integration encapsulated in services/purchases.ts
- Surfaces clean async functions, hides SDK complexity

**Design System Scalability:**
- All colors, spacing, typography centralized
- Component variants (Button: primary/secondary/outline/ghost) reuse foundation
- Scaling applied via config objects (scaleConfig in TreeNode)
- Easy to maintain visual consistency as app grows

**Feature Gating Architecture:**
- FeatureGate component wraps content with subscription checks
- TIER_LIMITS object is source of truth for each tier's capabilities
- Store methods derived from TIER_LIMITS for consistency
- Paywall surface features blocked by tier

---

## Key Files

### Entry Points
- `app/_layout.tsx` - Root layout, navigation setup
- `app/(tabs)/_layout.tsx` - Tab navigation configuration

### Screens
- `app/(tabs)/index.tsx` - Feed screen
- `app/(tabs)/tree.tsx` - Family tree screen
- `app/(tabs)/profile.tsx` - Profile screen
- `app/member/[id].tsx` - Member detail modal
- `app/paywall.tsx` - Subscription paywall

### Components
- `src/components/common/Button.tsx`
- `src/components/common/Avatar.tsx`
- `src/components/common/Card.tsx`
- `src/components/feed/FeedItem.tsx`
- `src/components/tree/TreeNode.tsx`
- `src/components/tree/VineConnector.tsx`

### State & Data
- `src/stores/authStore.ts`
- `src/stores/feedStore.ts`
- `src/stores/subscriptionStore.ts`
- `src/types/user.ts`
- `src/types/feed.ts`
- `src/types/subscription.ts`

### Services & Constants
- `src/services/firebase.ts`
- `src/services/purchases.ts`
- `src/constants/colors.ts`
- `src/constants/typography.ts`
- `src/constants/spacing.ts`

### Utilities
- `src/utils/dailyVerses.ts`
- `src/utils/mockData.ts`
