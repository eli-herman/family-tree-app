# Security Review: The Vine Subscription System

**Review Date:** 2026-02-02
**Reviewer:** Security Specialist (Claude)
**Scope:** Payment/subscription code analysis for paywall bypass, data validation, and secure state management

---

## Executive Summary

The current subscription implementation relies entirely on client-side trust with no server-side verification. This architecture allows trivial paywall bypass through client manipulation. Before processing real payments, critical changes are needed to prevent revenue loss and ensure subscription integrity.

**Risk Level:** HIGH - Revenue loss and feature abuse possible

---

## 1. Critical Issues (Must Fix Before Launch)

### 1.1 No Server-Side Subscription Verification

**Files Affected:**
- `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts`
- `/Users/eli.j.herman/projects/family-tree-app/src/components/common/FeatureGate.tsx`

**Issue:** All subscription checks happen client-side using Zustand store state. The `FeatureGate` component and feature check functions (`canAddMember`, `canRecordAudio`, etc.) read from local state that can be manipulated.

**Attack Vector:**
```javascript
// Attacker can use React DevTools or modify app bundle to:
useSubscriptionStore.setState({ tier: 'legacy', isActive: true });
// Now all premium features are unlocked without payment
```

**Impact:** Complete paywall bypass - users can access all premium features without paying.

**Required Fix:**
- Implement server-side verification for all premium actions
- Store subscription state in Firebase Firestore (as planned in MONETIZATION-PLAN.md)
- Verify subscription status via server before allowing premium operations

---

### 1.2 Subscription State Not Persisted Securely

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts`

**Issue:** The subscription store initializes to `free` tier on every app restart:

```typescript
const initialState: SubscriptionInfo = {
  tier: 'free',
  isActive: true,
  expiresAt: null,
  // ...
};
```

There is no persistence layer. When the app is reopened:
1. User starts as "free"
2. `getSubscriptionInfo()` must be called to restore state from RevenueCat
3. Race condition: UI may render before subscription state is restored

**Security Implication:** If persistence were added using AsyncStorage (unencrypted), attackers could modify stored subscription data. Additionally, the current implementation has no expiration check after state restoration.

**Required Fix:**
- Use `expo-secure-store` for any locally cached subscription data
- Always verify against RevenueCat/server on app launch
- Implement proper loading states to prevent feature access during verification

---

### 1.3 No Expiration Validation

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/stores/subscriptionStore.ts`

**Issue:** The `expiresAt` field is stored but never validated. Feature checks don't verify if the subscription has expired:

```typescript
canRecordAudio: () => {
  const { tier } = get();
  return TIER_LIMITS[tier].canRecordAudio;
  // No check: is expiresAt in the past?
},
```

**Attack Vector:** Set `expiresAt` to a past date but `isActive: true` - features remain accessible.

**Required Fix:**
```typescript
// All feature checks should include:
const { tier, isActive, expiresAt } = get();
if (!isActive) return false;
if (expiresAt && new Date() > expiresAt) return false;
return TIER_LIMITS[tier].canRecordAudio;
```

---

### 1.4 Placeholder API Keys in Production Code

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts`

**Issue:** Hardcoded placeholder API keys:

```typescript
const REVENUECAT_API_KEY_IOS = 'your_revenuecat_ios_key';
const REVENUECAT_API_KEY_ANDROID = 'your_revenuecat_android_key';
```

**Risk:** If these placeholders are not replaced before release:
1. App will fail to connect to RevenueCat
2. Error handling falls back to `free` tier (line 43-48) - potential unintended free access
3. Keys in source code could be extracted from app bundle if real keys are added here

**Required Fix:**
- Move API keys to environment variables (already partially done with Firebase)
- Add build-time validation that keys are not placeholder values
- Consider using `expo-constants` for managed builds

---

### 1.5 Error Handling Falls Back to Free Tier (Silent Failure)

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts` (lines 42-48)

**Issue:**
```typescript
} catch (error) {
  console.error('Error getting subscription info:', error);
  return {
    tier: 'free',
    isActive: true,
    expiresAt: null,
  };
}
```

**Attack Vector:** An attacker could force network errors to trigger this fallback, then modify the returned state to `legacy` tier before it reaches the store.

**Better Approach:**
- Return an error state that the UI handles explicitly
- Don't automatically assume "free" - could be a paying customer with network issues
- Show "Unable to verify subscription" state with retry option

---

## 2. Recommendations (Best Practices)

### 2.1 Implement Receipt Validation

**Current State:** RevenueCat handles receipt validation, which is good. However, there's no webhook integration to sync subscription state to your backend.

**Recommendation:**
1. Set up RevenueCat webhooks to Firebase Cloud Functions
2. Store canonical subscription state in Firestore
3. Client reads from Firestore (not just RevenueCat SDK) for feature gating

Reference: MONETIZATION-PLAN.md already mentions this:
```
// users/{userId}/subscription
{
  tier: 'family',
  provider: 'apple' | 'google',
  productId: '...',
  expiresAt: Timestamp,
  isActive: boolean
}
```

---

### 2.2 Add Subscription State Logging/Analytics

**Purpose:** Detect anomalies that indicate tampering or bugs.

**Track:**
- Tier changes without corresponding purchase events
- Feature access attempts when subscription is expired
- Mismatches between local state and server state
- Unusual patterns (e.g., 100 members on "free" tier)

---

### 2.3 Protect Sensitive Counts Server-Side

**Current:** `currentCount` is passed to `canAddMember(currentCount)` from client code.

**Issue:** If the count comes from client state, an attacker could pass `0` even with 100 members.

**Recommendation:**
- Store member/photo counts in Firestore
- Enforce limits in Firestore Security Rules:

```javascript
// Firestore Security Rules example
match /families/{familyId}/members/{memberId} {
  allow create: if
    // Check subscription tier allows more members
    get(/databases/$(database)/documents/users/$(request.auth.uid)/subscription).data.tier != 'free' ||
    // Or count is under free limit
    countDocuments(/families/$(familyId)/members) < 5;
}
```

---

### 2.4 Add Rate Limiting for Restore Purchases

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts`

**Issue:** `restorePurchases()` can be called unlimited times.

**Risk:** While not a direct security issue, excessive calls could:
- Trigger App Store rate limits
- Be used to probe for valid subscriptions

**Recommendation:** Add client-side rate limiting (e.g., 3 attempts per hour).

---

### 2.5 Validate Product IDs

**File:** `/Users/eli.j.herman/projects/family-tree-app/src/services/purchases.ts`

**Issue:** `getTierFromProductId()` uses simple string matching:

```typescript
if (productId.includes('legacy')) {
  return 'legacy';
}
```

**Risk:** A malicious product ID like `fake_legacy_exploit` would return `legacy` tier.

**Recommendation:** Use exact matching against known product IDs:

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

### 2.6 Paywall UI Security

**File:** `/Users/eli.j.herman/projects/family-tree-app/app/paywall.tsx`

**Current Issues:**
1. `handleSubscribe()` and `handleRestore()` are stub implementations (just `console.log`)
2. No loading state during purchase flow
3. No error handling for failed purchases

**Recommendations:**
- Add loading states to prevent double-taps
- Implement proper error messages for failed purchases
- Add purchase confirmation before processing

---

## 3. Architecture Notes (Server-Side Validation Required)

### What MUST Be Validated Server-Side

| Action | Why Server-Side |
|--------|-----------------|
| Adding family member | Enforce member limits even if client is compromised |
| Uploading photo | Enforce storage limits; prevent abuse |
| Recording audio/video | Premium feature - verify subscription before upload |
| Exporting data | Premium feature - validate before generating export |
| Creating deceased archive | Premium feature validation |

### Recommended Server Architecture

```
[Client App]
     |
     | 1. Request premium action
     v
[Firebase Cloud Function]
     |
     | 2. Check /users/{uid}/subscription
     |    - Is tier sufficient?
     |    - Is subscription active?
     |    - Is expiresAt in future?
     |
     | 3. If valid, perform action
     v
[Firestore / Cloud Storage]
     |
     | 4. Return success/failure
     v
[Client App]
```

### RevenueCat Webhook Integration

Set up webhooks for these events:
- `INITIAL_PURCHASE` - Create subscription record
- `RENEWAL` - Update expiresAt
- `CANCELLATION` - Set isActive = false
- `EXPIRATION` - Set isActive = false
- `BILLING_ISSUE` - Flag for grace period

Firebase Cloud Function example endpoint:
```
POST https://us-central1-{project}.cloudfunctions.net/revenuecat-webhook
```

---

## 4. Implementation Priority

### Before TestFlight/Internal Testing:
1. Replace placeholder API keys with real keys
2. Implement expiration validation in feature checks
3. Add server-side subscription state in Firestore
4. Wire up paywall.tsx to actual purchase flow

### Before Public Launch:
5. Set up RevenueCat webhooks to Firebase
6. Implement Firestore Security Rules for limits
7. Add server-side validation for premium actions
8. Implement proper error states (not silent fallback to free)
9. Add subscription state logging/analytics

### Post-Launch Hardening:
10. Add rate limiting for restore purchases
11. Implement anomaly detection
12. Add encrypted local caching with expo-secure-store

---

## 5. Testing Checklist

Before launch, test these scenarios:

- [ ] Purchase flow completes and unlocks features
- [ ] Restore purchases works for existing subscribers
- [ ] Expired subscriptions are properly blocked
- [ ] Network errors don't grant unintended access
- [ ] Free tier limits are enforced (5 members, 50 photos)
- [ ] Subscription state persists across app restarts
- [ ] Subscription state syncs across devices (via RevenueCat)
- [ ] Downgrade from paid to free properly restricts features
- [ ] Grace period for billing issues works correctly

---

## Summary

The current implementation provides a good UI foundation but lacks the security infrastructure needed for real-money transactions. The primary concern is **100% client-side trust** - all subscription checks can be bypassed by modifying local state.

**Minimum viable security requires:**
1. Server-side subscription state in Firestore
2. Server-side enforcement of premium actions
3. Expiration validation in all feature checks
4. RevenueCat webhook integration for state sync

These changes align with the existing plans in MONETIZATION-PLAN.md but should be treated as security requirements, not optional enhancements.

---

*Review completed: 2026-02-02*
