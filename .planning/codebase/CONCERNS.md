# CONCERNS

## Overview

The Vine codebase is well-structured and follows React Native/TypeScript best practices with a clean component hierarchy and proper state management via Zustand. However, there are several critical areas of concern, particularly around the subscription/payment system which is not yet production-ready. The implementation requires server-side verification before handling real money transactions. Additionally, there are configuration gaps, incomplete integrations, and some code that relies heavily on placeholder values.

**Overall Codebase Health:** Moderate with high-priority security concerns

---

## Critical Security Issues

### 1. No Server-Side Subscription Verification

**Severity:** CRITICAL - Revenue loss possible

**Files Affected:**
- `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts`
- `/Users/eli.j.herman/projects/family-tree-app/src/components/common/FeatureGate.tsx`
- `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts`

**Issue:**
All subscription checks are performed entirely on the client side. The `FeatureGate` component and feature check functions (`canAddMember()`, `canRecordAudio()`, etc.) read from local Zustand store state that can be trivially manipulated without any server-side validation.

**Attack Vector Example:**
An attacker could use React DevTools or modify the app state to set `tier: 'legacy'` without any payment being processed. All premium features would unlock immediately.

**Impact:**
- Complete paywall bypass - users can access all premium features without paying
- No revenue enforcement at the backend
- Family limits (5 members, 50 photos) enforced only on client

**Required Fix:**
- Implement server-side verification for all premium operations
- Store canonical subscription state in Firestore (architecture already planned in MONETIZATION-PLAN.md)
- Verify subscription status via Cloud Functions before allowing premium operations
- Enforce limits via Firestore Security Rules

---

### 2. No Expiration Validation in Feature Checks

**Severity:** HIGH - Allows expired subscriptions to remain active

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts` (lines 48-78)

**Issue:**
The `SubscriptionInfo` type includes an `expiresAt` field, but feature check methods never validate it:

```typescript
canRecordAudio: () => {
  const { tier } = get();
  return TIER_LIMITS[tier].canRecordAudio;
  // MISSING: if (expiresAt && new Date() > expiresAt) return false;
},
```

**Impact:**
- Expired subscriptions remain active indefinitely
- Users can enjoy premium features past their subscription end date
- No grace period handling

**Fix Required:**
All feature checks must validate expiration:
```typescript
const { tier, isActive, expiresAt } = get();
if (!isActive || (expiresAt && new Date() > expiresAt)) return false;
return TIER_LIMITS[tier].canFeature;
```

---

### 3. Placeholder API Keys in Production Code

**Severity:** HIGH - Config/integration blocker

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts` (lines 8-10)

**Issue:**
RevenueCat API keys are hardcoded placeholder values:
```typescript
const REVENUECAT_API_KEY_IOS = 'your_revenuecat_ios_key';
const REVENUECAT_API_KEY_ANDROID = 'your_revenuecat_android_key';
```

**Risks:**
1. App fails to connect to RevenueCat - purchases cannot process
2. Error handling falls back to free tier (line 42-48) - could result in unintended free access
3. If real keys are added here (instead of env vars), they'll be in source code and extractable from app bundle

**Also in Firebase:** `/Users/eli.j.herman/projects/family-tree-app/src/services/firebase.ts` (line 10) has placeholder config
```typescript
// TODO: Replace with your actual Firebase config from console.firebase.google.com
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'YOUR_API_KEY',
  // ...
};
```

**Fix Required:**
- Move all API keys to environment variables (Expo supports `EXPO_PUBLIC_*` prefix)
- Add build-time validation that keys are not placeholder values
- Never commit real keys to source code

---

### 4. Error Handling Falls Back to Free Tier (Silent Failure)

**Severity:** HIGH - Security bypass in error path

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts` (lines 37-48)

**Current Code:**
```typescript
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return {
      tier: 'free',
      isActive: true,
      expiresAt: null,
    };
  }
}
```

**Problem:**
- Network error → returns free tier
- Could be exploited to trigger fallback path
- Doesn't distinguish between "network down" and "invalid subscription"
- Paying customer with network issues gets downgraded to free

**Better Approach:**
- Return explicit error state or retry mechanism
- Let UI handle "subscription verification failed" state
- Don't assume free tier on error - could be a paying customer

---

## Technical Debt

### 1. Incomplete Paywall Integration

**Severity:** HIGH - Stub implementation

**File:** `/Users/eli.j.herman/projects/family-tree-app/app/paywall.tsx` (lines 106-115)

**Issue:**
Purchase and restore handlers are non-functional stubs:
```typescript
const handleSubscribe = () => {
  const product = selectedTier === 'family' ? familyProduct : legacyProduct;
  // TODO: Integrate with RevenueCat to purchase
  console.log('Subscribe to:', product?.id);
};

const handleRestore = () => {
  // TODO: Integrate with RevenueCat to restore purchases
  console.log('Restore purchases');
};
```

**Missing:**
- No loading state during purchase
- No error handling for failed purchases
- No purchase confirmation flow
- No link to actual RevenueCat purchase API

---

### 2. No Subscription State Persistence

**Severity:** MEDIUM - UX/security issue

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts`

**Issue:**
Subscription state initializes to `free` on every app restart:
```typescript
const initialState: SubscriptionInfo = {
  tier: 'free',
  isActive: true,
  expiresAt: null,
  // ...
};
```

There is no persistence layer. The app must call `getSubscriptionInfo()` to restore state from RevenueCat.

**Problems:**
1. Race condition: UI may render with free tier before verification completes
2. No loading state to prevent feature access during verification
3. Users see "free" briefly on app launch even if they're paid subscribers

---

### 3. TypeScript Type Looseness in Error Handling

**Severity:** MEDIUM - Type safety issue

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts` (line 76)

**Issue:**
```typescript
} catch (error: any) {
  if (error.userCancelled) {
    throw new Error('Purchase cancelled');
  }
  throw error;
}
```

Using `any` type bypasses TypeScript safety. The `error.userCancelled` check is not type-safe.

**Fix:** Define proper error types from RevenueCat SDK or create custom error type.

---

### 4. No Validation of `currentCount` Parameters

**Severity:** MEDIUM - Client-side enforcement only

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts` (lines 48-102)

**Issue:**
Feature checks accept `currentCount` from client code:
```typescript
canAddMember: (currentCount) => {
  const { tier } = get();
  const limit = TIER_LIMITS[tier].maxMembers;
  return currentCount < limit;
},
```

If the count comes from client state, an attacker could pass `0` even if they have 100 members.

**Impact:**
- Can't trust the count without server verification

**Solution:**
- Store member/photo counts in Firestore
- Enforce limits via Firestore Security Rules, not client code

---

## Performance Concerns

### 1. No Memoization in Feature Gate Component

**Severity:** LOW - Minor perf issue

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/components/common/FeatureGate.tsx` (line 35)

**Issue:**
The `useFeatureAccess()` hook returns new object every render:
```typescript
export function useFeatureAccess() {
  const store = useSubscriptionStore();
  return {
    canAddMember: store.canAddMember,
    canUploadPhoto: store.canUploadPhoto,
    // ... returns new object every time
  };
}
```

**Fix:** Memoize with `useMemo()` or create selector functions.

---

### 2. AsyncStorage vs Secure Storage

**Severity:** MEDIUM - Security issue for sensitive data

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/firebase.ts` (line 7)

**Current Setup:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

**Issue:**
AsyncStorage is unencrypted. If subscription state were cached here, it could be modified.

**Note:** App also includes `expo-secure-store` (see app.json, line 34), but it's not being used yet.

**Recommendation:**
- Use `expo-secure-store` for any cached sensitive data (subscription tokens, etc.)
- AsyncStorage is fine for non-sensitive preferences only

---

## TODOs and FIXMEs

### Found in Codebase:

1. **Firebase Configuration**
   - File: `/Users/eli.j.herman/projects/family-tree-app/src/services/firebase.ts:10`
   - Status: Placeholder values present - needs actual Firebase credentials

2. **RevenueCat API Keys**
   - File: `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts:8`
   - Status: Placeholder values present - needs actual API keys

3. **Paywall Subscribe Handler**
   - File: `/Users/eli.j.herman/projects/family-tree-app/app/paywall.tsx:108`
   - Status: Stub implementation - needs RevenueCat integration

4. **Paywall Restore Handler**
   - File: `/Users/eli.j.herman/projects/family-tree-app/app/paywall.tsx:113`
   - Status: Stub implementation - needs RevenueCat integration

---

## Fragile Areas

### 1. Subscription Tier Matching

**Severity:** MEDIUM - Fragile string matching

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts` (lines 140-148)

**Issue:**
```typescript
export function getTierFromProductId(productId: string): SubscriptionTier {
  if (productId.includes('legacy')) {
    return 'legacy';
  }
  if (productId.includes('family')) {
    return 'family';
  }
  return 'free';
}
```

**Problems:**
- Uses `includes()` instead of exact matching
- A malicious product ID like `fake_legacy_exploit` would incorrectly return `legacy`
- No validation against known product IDs

**Recommended Fix:**
```typescript
const PRODUCT_ID_TO_TIER: Record<string, SubscriptionTier> = {
  'com.eliherman.thevine.family.monthly': 'family',
  'com.eliherman.thevine.family.yearly': 'family',
  'com.eliherman.thevine.legacy.monthly': 'legacy',
  'com.eliherman.thevine.legacy.yearly': 'legacy',
};

export function getTierFromProductId(productId: string): SubscriptionTier {
  return PRODUCT_ID_TO_TIER[productId] ?? 'free';
}
```

---

### 2. Missing Type on Firebase Auth Persistence

**Severity:** LOW - Type safety issue

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/firebase.ts` (line 3-4)

**Issue:**
```typescript
// @ts-ignore - getReactNativePersistence exists but types are outdated
import { getReactNativePersistence } from 'firebase/auth';
```

The `@ts-ignore` comment indicates outdated Firebase types. This should be revisited when Firebase is upgraded.

---

### 3. Subscription Store State Initialization

**Severity:** LOW - Could be clearer

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts` (lines 28-34)

**Issue:**
Starting state is hardcoded with no indication of when it's actually loaded from RevenueCat. There's no loading state flag to indicate "verification in progress."

**Recommendation:**
Add `isLoading` flag to subscription store to track async verification state:
```typescript
interface SubscriptionState extends SubscriptionInfo {
  isLoading: boolean;  // true while checking RevenueCat
  setLoading: (loading: boolean) => void;
}
```

---

## Dependencies & Version Concerns

### Current Dependencies:

| Package | Version | Notes |
|---------|---------|-------|
| React Native | 0.81.5 | Latest stable |
| Expo | ~54.0.33 | Latest |
| Firebase | ^12.8.0 | Requires Node 14+ |
| react-native-purchases | ^9.7.5 | RevenueCat SDK - has good TypeScript support |
| Zustand | ^5.0.11 | Latest - solid choice |

**No major version concerns identified.** Versions are recent and well-maintained.

---

## Architecture & Design Concerns

### 1. Feature Gating is Client-Only

**Issue:** Complete reliance on client-side checks for premium features. As noted in SECURITY-REVIEW.md, this must be accompanied by server-side enforcement.

**Current Flow:**
```
Client: Check canRecordAudio() → Allow/Deny
(No server verification)
```

**Required Flow:**
```
Client: Request audio upload
  ↓
Server (Cloud Function): Check subscription tier
  ↓
Allow/Deny + Enforce in Firestore
```

---

### 2. No Rate Limiting on Critical Operations

**Issue:** Functions like `restorePurchases()` can be called unlimited times without throttling.

**Risk:** While not a direct security issue, it could trigger App Store rate limits or be used to probe for valid subscriptions.

**Recommendation:** Add client-side rate limiting (e.g., max 3 attempts per hour).

---

### 3. Incomplete Integration with Firestore

**Issue:** Subscription state is not synced to Firestore. The MONETIZATION-PLAN.md describes storing subscription in Firestore for server-side checks, but this is not implemented yet.

**Missing Implementation:**
- No `users/{userId}/subscription` document structure
- No Cloud Function to sync RevenueCat → Firestore
- No Firestore Security Rules for subscription enforcement

---

## Code Quality Issues

### 1. Minimal Error Logging

**Severity:** LOW - Affects debugging

**Issue:** Only basic `console.error()` statements. No structured error logging or analytics tracking of subscription issues.

**Example:**
```typescript
} catch (error) {
  console.error('Error getting subscription info:', error);
  // Could be improved with error tracking service
}
```

**Recommendation:** Add error logging service (Sentry, Firebase Crashlytics, etc.) when closer to production.

---

### 2. No Input Validation in Type Definitions

**Issue:** FamilyMember types don't enforce constraints at the type level.

**Example:**
```typescript
interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: Date;
  deathDate?: Date;  // No validation: deathDate > birthDate
  // ...
}
```

---

## Recommendations Priority

### Before TestFlight/Internal Testing:
1. Replace placeholder Firebase config with actual credentials
2. Replace placeholder RevenueCat API keys with real keys
3. Implement expiration validation in all feature checks (add `expiresAt` check)
4. Wire up `paywall.tsx` purchase handlers to RevenueCat SDK
5. Fix `getTierFromProductId()` to use exact matching

### Before Public Launch:
6. Implement Firestore subscription state storage (`users/{userId}/subscription`)
7. Create Cloud Functions to verify subscriptions server-side
8. Add Firestore Security Rules to enforce member/photo limits
9. Fix error handling to not fall back to free tier on network error
10. Add subscription state logging/analytics to detect anomalies
11. Remove `@ts-ignore` comment when Firebase types are updated

### Post-Launch Hardening:
12. Set up RevenueCat webhooks to sync subscription state
13. Add rate limiting for `restorePurchases()`
14. Implement subscription state caching with `expo-secure-store`
15. Add encrypted device-level subscription token caching

---

## Summary Table

| Category | Count | Severity | Blocker |
|----------|-------|----------|---------|
| Critical Security | 4 | CRITICAL | Yes |
| Technical Debt | 4 | HIGH | Yes |
| Performance | 2 | LOW-MEDIUM | No |
| TODOs | 4 | HIGH | Yes |
| Fragile Areas | 3 | LOW-MEDIUM | No |
| Architecture | 3 | MEDIUM | Yes |

**Total Items of Concern:** 20

**Launch Readiness:** NOT READY - Subscription system requires security hardening before processing real payments.

---

*Document generated: 2026-02-02*
*Analysis based on codebase at `/Users/eli.j.herman/projects/family-tree-app`*
