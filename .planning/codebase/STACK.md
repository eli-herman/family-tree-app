# STACK.md

## Overview
The Vine is built on a modern cross-platform mobile stack using React Native with Expo, TypeScript for type safety, and a managed service architecture. The app targets iOS, Android, and Web platforms with a focus on performance and native feel.

## Details

### Runtime & Framework
- **Expo ~54.0.33** - Managed React Native platform providing development server, build service, and native module management. Enables fast development with live reloading and cloud builds for iOS/Android.
- **React 19.1.0** - Latest React version with concurrent rendering and automatic batching for improved performance.
- **React Native 0.81.5** - Cross-platform mobile framework with native components mapped to iOS/Android UI primitives.
- **TypeScript ~5.9.2** - Strict type checking with TypeScript 5.9 for type safety across the codebase. Configuration in `tsconfig.json` extends `expo/tsconfig.base` with strict mode enabled.

### Core Navigation & UI
- **expo-router ~6.0.23** - File-based routing system similar to Next.js. Route tree defined in `app/` directory with typed routes enabled (`typedRoutes: true` in `app.json`).
  - Screens: `app/(tabs)/` for bottom tab navigation (Feed, Tree, Profile)
  - Modals: `app/member/[id].tsx` for dynamic member detail screens
  - Paywall: `app/paywall.tsx` for subscription UI
- **@react-navigation/native ^7.1.28**, **@react-navigation/native-stack ^7.11.0**, **@react-navigation/bottom-tabs ^7.10.1** - React Navigation core and navigators for cross-platform navigation management.
- **react-native-gesture-handler ~2.28.0** - Native gesture recognition library underlying React Navigation and component interactions.
- **react-native-screens ~4.16.0** - Native screen containers for optimized navigation performance.
- **react-native-safe-area-context ~5.6.0** - Handle safe area insets (notches, home indicators) across iOS/Android.
- **react-native-reanimated ~4.1.1** - High-performance animation library with native worklets for smooth 60fps animations.
- **react-native-worklets ^0.7.2** - Worklet support for running JavaScript on native threads without bridge overhead.

### UI Components & Media
- **react-native-svg ^15.12.1** - SVG rendering support for vector graphics including the vine connector visualizations.
- **expo-image ~3.0.11** - Optimized image component with caching and progressive loading.
- **expo-av ~16.0.8** - Audio/video playback and recording capabilities for story audio memories (Family tier+) and video recording (Legacy tier).
- **expo-status-bar ~3.0.9** - Status bar styling and appearance control.

### State Management & Storage
- **zustand ^5.0.11** - Lightweight state management library. Used for:
  - `authStore.ts` - User authentication state
  - `feedStore.ts` - Feed items state
  - `subscriptionStore.ts` - Subscription tier and feature gating
- **@react-native-async-storage/async-storage 2.2.0** - Persistent local storage for user preferences and cached data.
- **react-native-mmkv ^4.1.2** - High-performance key-value storage using MMKV (Memory-Mapped Key-Value) for larger data or frequent updates. Often used as persistence layer for Zustand.

### Date & Time
- **date-fns ^4.1.0** - Lightweight date utility library for parsing, formatting, and calculating dates. Used in verse scheduling and timestamp handling.

### Authentication & Storage
- **expo-secure-store ~15.0.8** - Secure credential storage using platform-native keychains (iOS Keychain, Android Keystore). Configured as plugin in `app.json`.

### Deep Linking
- **expo-linking ~8.0.11** - URL scheme handling for deep linking. App scheme configured as `thevine` in `app.json`.
- **expo-constants ~18.0.13** - App constants and environment variables access.

### Backend & Monetization
- **firebase ^12.8.0** - Complete Firebase integration:
  - Authentication (Auth) with React Native persistence
  - Firestore (NoSQL database) for user data, family trees, and feed items
  - Storage (Cloud Storage) for photos and media
  - Configuration from environment variables (EXPO_PUBLIC_FIREBASE_*)
- **react-native-purchases ^9.7.5** - RevenueCat SDK for in-app purchases and subscription management:
  - Handles iOS App Store and Google Play Store transactions
  - Manages entitlements for Family and Legacy tiers
  - Platform-specific API keys configured in `src/services/purchases.ts`

### TypeScript Configuration
- **tsconfig.json** - Extends Expo's base TypeScript config with strict mode enabled. Includes all `.ts` and `.tsx` files and Expo type definitions.

## Key Files
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration, plugins, iOS/Android settings
- `tsconfig.json` - TypeScript compiler options
- `src/services/firebase.ts` - Firebase initialization with config from environment variables
- `src/services/purchases.ts` - RevenueCat SDK initialization and subscription logic
- `src/stores/authStore.ts` - Zustand auth state
- `src/stores/subscriptionStore.ts` - Zustand subscription state with feature gating
- `src/constants/colors.ts` - Design system color palette
- `src/constants/typography.ts` - Typography scale and font definitions
- `src/constants/spacing.ts` - Spacing scale
- `app/_layout.tsx` - Root layout with GestureHandler and SafeAreaProvider
- `app/(tabs)/_layout.tsx` - Bottom tab navigation layout
- `app/paywall.tsx` - Subscription tier selection UI
