# INTEGRATIONS.md

## Overview
The Vine integrates with major cloud platforms and third-party services for authentication, data persistence, media storage, subscription management, and app monetization. All integrations are configured via environment variables and SDK initialization in dedicated service modules.

## Details

### Firebase (Backend-as-a-Service)
**File:** `src/services/firebase.ts`

Firebase is the primary backend providing auth, database, and storage.

- **Firebase Authentication** - User signup, login, password reset, and session management
  - React Native persistence enabled via `getReactNativePersistence()` with AsyncStorage
  - Configuration: `firebaseConfig` object with API key and project details from environment
  - Exported: `auth` object for use across app

- **Firestore Database** - NoSQL document database for structured data:
  - **Users collection** - User accounts with email, displayName, photoURL, timestamps
  - **FamilyMembers collection** - Family tree nodes with relationships, biographical data
  - **FeedItems collection** - Photos, memories, milestones, and prompt responses
  - **Prompts collection** - Story prompts for the app
  - Exported: `db` object

- **Cloud Storage** - Media file hosting for user photos and video:
  - Photo uploads from feed
  - Video uploads (Legacy tier feature)
  - Audio recording storage (Family/Legacy tier features)
  - Exported: `storage` object

- **Configuration Variables** (in `.env.example` and environment):
  - `EXPO_PUBLIC_FIREBASE_API_KEY` - Public API key
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - Auth domain (project.firebaseapp.com)
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` - Storage bucket (project.appspot.com)
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Messaging sender ID
  - `EXPO_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### RevenueCat (In-App Purchases & Subscriptions)
**File:** `src/services/purchases.ts`

RevenueCat bridges Apple App Store and Google Play Store for subscription management and feature entitlements.

- **Functions Exported:**
  - `initializePurchases(userId)` - Initialize RevenueCat SDK with platform-specific API keys
  - `getSubscriptionInfo()` - Retrieve current customer subscription tier and expiration
  - `getOfferings()` - Fetch available subscription packages to display in paywall
  - `purchasePackage(pkg)` - Process purchase for selected subscription tier
  - `restorePurchases()` - Restore previous purchases on account
  - `getTierFromProductId(productId)` - Map product ID to subscription tier

- **Entitlements** - Two active entitlements in RevenueCat dashboard:
  - `family` - Family tier entitlement
  - `legacy` - Legacy tier entitlement (higher tier, includes Family features)

- **Configuration Variables** (in `src/services/purchases.ts` - TODO to replace):
  - `REVENUECAT_API_KEY_IOS` - iOS App Store revenue reporting key
  - `REVENUECAT_API_KEY_ANDROID` - Google Play Store revenue reporting key

- **Subscription Tiers** (defined in `src/types/subscription.ts`):
  - **Free** - Limited to 5 members, 50 photos
  - **Family** - Unlimited members/photos, audio recording, deceased member archives, $4.99/mo or $39.99/yr
  - **Legacy** - Everything in Family plus video recording, export/backup, printed memory book, early feature access, $9.99/mo or $79.99/yr

- **Customer Info Parsing:**
  - Maps RevenueCat `CustomerInfo` to app `SubscriptionInfo` type
  - Extracts store provider (apple/google) from `legacy.store`
  - Returns `null` expiration date for non-expiring subscriptions

### State Management Architecture
**Files:** `src/stores/authStore.ts`, `src/stores/subscriptionStore.ts`

- **AuthStore** (`useAuthStore` hook)
  - Manages current `user` (User | null), authentication status, and loading state
  - Actions: `setUser()`, `setLoading()`, `logout()`
  - Populated on app startup from Firebase Auth

- **SubscriptionStore** (`useSubscriptionStore` hook)
  - Extends `SubscriptionInfo` type with feature-checking methods
  - Feature gates: `canAddMember()`, `canUploadPhoto()`, `canRecordAudio()`, `canRecordVideo()`, `canArchiveDeceased()`, `canExport()`
  - Limit tracking: `getMemberLimit()`, `getPhotoLimit()`, `getRemainingMembers()`, `getRemainingPhotos()`
  - References `TIER_LIMITS` constant from `src/types/subscription.ts` for tier-specific constraints
  - Populated from RevenueCat `getSubscriptionInfo()` on startup

### Data Types & Structures
**Files:** `src/types/`

- **User** - Firebase Auth user representation
  - `id` - Firebase UID
  - `email`, `displayName`, `photoURL`
  - `createdAt`, `updatedAt` - Timestamps

- **FamilyMember** - Tree node for family relationship mapping
  - `id` - Firestore document ID
  - `userId` - Links to User if member has app account
  - `firstName`, `lastName`, `nickname`
  - `photoURL`, `birthDate`, `deathDate`, `bio`
  - `relationships` - Array of Relationship objects
  - `createdBy` - User ID who added member
  - `createdAt`, `updatedAt` - Timestamps

- **FeedItem** - Social feed entry
  - `id` - Firestore document ID
  - `type` - 'photo' | 'memory' | 'milestone' | 'prompt_response'
  - `authorId`, `authorName`, `authorPhotoURL`
  - `content` - Text, mediaURLs, optional prompt reference
  - `hearts` - Array of user IDs who reacted
  - `createdAt`, `updatedAt` - Timestamps

- **SubscriptionInfo** - Current user subscription state
  - `tier` - 'free' | 'family' | 'legacy'
  - `isActive` - Boolean subscription active status
  - `expiresAt` - Date or null for non-expiring
  - `provider` - 'apple' | 'google' (optional)
  - `productId` - Store product identifier (optional)

### Feature Gating & Paywall
**Files:** `app/paywall.tsx`, `src/components/common/FeatureGate.tsx`, `src/components/common/UpgradeBanner.tsx`

- **Paywall Screen** - Displays monthly/yearly toggle and tier comparison cards
  - Shows features included in each tier with "Recommended" and "Save X%" badges
  - Calls `purchasePackage()` on subscribe (TODO: integrate RevenueCat)
  - Calls `restorePurchases()` on restore (TODO: integrate RevenueCat)

- **FeatureGate Component** - Conditionally renders content based on subscription tier
  - Wraps features requiring specific tiers
  - Shows UpgradeBanner when user lacks required tier

- **UpgradeBanner Component** - Prompts user to subscribe for locked features

### Environment & Configuration
**File:** `.env.example`

Public environment variables (prefixed with `EXPO_PUBLIC_` to be embedded in app bundle):
- Firebase configuration (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID)
- Note: RevenueCat API keys currently hardcoded in `src/services/purchases.ts` (TODO: move to env)

**Expo Configuration:**
- **app.json** - Platform-specific settings:
  - iOS: Bundle identifier `com.eliherman.thevine`, tablet support enabled
  - Android: Package name `com.eliherman.thevine`, edge-to-edge enabled, adaptive icon configured
  - Web: Metro bundler configured
  - Plugins: `expo-secure-store`, `expo-router`
  - New Architecture enabled (`newArchEnabled: true`)
  - Deep link scheme: `thevine`

### Data Flow Summary

1. **On App Startup:**
   - Initialize Firebase with environment config
   - Check Firebase Auth session, populate AuthStore
   - Initialize RevenueCat with platform API key and authenticated user ID
   - Fetch customer subscription info, populate SubscriptionStore
   - Fetch Firestore data (family members, feed items) if authenticated

2. **On User Login:**
   - Firebase Auth redirects to login screen or onboarding
   - After auth, fetch user profile from Firestore Users collection
   - Sync subscription status from RevenueCat
   - Load family tree and feed items from Firestore

3. **On Feed Item Creation:**
   - Validate subscription tier via SubscriptionStore feature gates
   - Upload media to Firebase Storage
   - Create FeedItem document in Firestore with Storage URLs and metadata
   - Real-time listeners update AuthStore feed

4. **On Purchase:**
   - User selects tier in paywall (`app/paywall.tsx`)
   - RevenueCat processes transaction with App Store/Play Store
   - EntitlementInfo updates reflect new tier
   - SubscriptionStore updated via `getSubscriptionInfo()`
   - FeatureGate components re-evaluate access

## Key Files
- `src/services/firebase.ts` - Firebase SDK initialization
- `src/services/purchases.ts` - RevenueCat SDK and purchase functions
- `src/stores/authStore.ts` - Zustand auth state management
- `src/stores/subscriptionStore.ts` - Zustand subscription state with feature gates
- `src/types/user.ts` - User and FamilyMember data structures
- `src/types/feed.ts` - FeedItem and Prompt data structures
- `src/types/subscription.ts` - SubscriptionInfo and tier limits
- `app/paywall.tsx` - Subscription tier selection UI
- `src/components/common/FeatureGate.tsx` - Conditional feature rendering
- `src/components/common/UpgradeBanner.tsx` - Upgrade prompts
- `.env.example` - Environment variable template
- `app.json` - Expo and platform configuration
