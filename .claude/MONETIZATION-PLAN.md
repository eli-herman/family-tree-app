# The Vine - Monetization & Subscription Plan

> Continue this implementation in the next session

## Overview

The Vine will use a **subscription-based freemium model** with per-family pricing.

---

## Subscription Tiers

### Free Tier
- **Price:** $0
- **Limits:**
  - 5 family members max
  - 50 photos total
  - No audio/video memories
  - Basic family tree
  - Daily Bible verse ✓
  - Heart reactions ✓

### Family Tier (Recommended)
- **Price:** $4.99/month or $39.99/year (33% savings)
- **Includes:**
  - Unlimited family members
  - Unlimited photos
  - Audio memories (voice recordings)
  - Deceased member archives
  - Full family tree features
  - Priority support

### Legacy Tier (Premium)
- **Price:** $9.99/month or $79.99/year
- **Includes:**
  - Everything in Family
  - Video memories
  - Annual printed memory book
  - Export/backup features
  - Early access to new features

---

## Competitive Advantage Summary

| Competitor | The Vine's Advantage |
|------------|---------------------|
| Facebook/Instagram | Private, no ads, no algorithms, no public pressure |
| Ancestry/MyHeritage | Living connections focus, not genealogy research; faith component |
| WhatsApp groups | Structured memories, family tree, long-term archive |
| Church apps | Family-focused, works across denominations |

**Unique Selling Points:**
1. **Only family app with daily Bible verses** - faith-centered
2. **Per-family pricing** - one subscription covers everyone
3. **"Digital heirloom"** - built to matter 10+ years
4. **Low-pressure UX** - no guilt, no metrics

---

## Technical Implementation Plan

### 1. RevenueCat Integration

**Package:** `react-native-purchases` (works with Expo)

```bash
npx expo install react-native-purchases
```

**Setup Required:**
- Create RevenueCat account (free tier available)
- Create App Store Connect subscription products
- Create Google Play subscription products
- Configure entitlements in RevenueCat dashboard

### 2. Feature Gating System

Create a subscription context/store:

```typescript
// src/stores/subscriptionStore.ts
interface SubscriptionState {
  tier: 'free' | 'family' | 'legacy';
  isActive: boolean;
  expiresAt: Date | null;

  // Feature checks
  canAddMember: (currentCount: number) => boolean;
  canUploadPhoto: (currentCount: number) => boolean;
  canRecordAudio: () => boolean;
  canRecordVideo: () => boolean;
}
```

### 3. Paywall Screen

Create `app/paywall.tsx`:
- Show tier comparison
- Highlight Family tier as recommended
- Annual savings badge
- Restore purchases button
- Privacy policy / Terms links

**Design Notes:**
- Use forest green for CTA buttons
- Show family imagery
- Include Bible verse about stewardship
- No pressure tactics, just value presentation

### 4. Firebase Entitlements

Store subscription status in Firestore for server-side checks:

```typescript
// users/{userId}/subscription
{
  tier: 'family',
  provider: 'apple' | 'google',
  productId: 'com.eliherman.thevine.family.yearly',
  expiresAt: Timestamp,
  isActive: boolean
}
```

### 5. Limit Enforcement Points

| Feature | Free Limit | Check Location |
|---------|------------|----------------|
| Family members | 5 | Add member flow |
| Photos | 50 | Photo upload |
| Audio | No | Record button |
| Video | No | Record button |
| Deceased archives | No | Add deceased flow |

### 6. Soft Paywall Triggers

Show paywall (non-blocking) when user:
- Tries to add 6th family member
- Uploads 40th photo (warning) or 51st (blocked)
- Taps audio record button
- Views premium feature

---

## App Store Requirements

### iOS (App Store Connect)
- Create subscription group: "The Vine Premium"
- Products:
  - `com.eliherman.thevine.family.monthly` - $4.99
  - `com.eliherman.thevine.family.yearly` - $39.99
  - `com.eliherman.thevine.legacy.monthly` - $9.99
  - `com.eliherman.thevine.legacy.yearly` - $79.99
- Subscription description and benefits
- Privacy policy URL required
- Terms of service URL required

### Android (Google Play Console)
- Create subscriptions with same product IDs
- Base plan + offers configuration
- Grace period settings

---

## Implementation Order

1. [ ] Set up RevenueCat account
2. [ ] Create App Store Connect subscription products
3. [ ] Create Google Play subscription products
4. [x] Install and configure react-native-purchases
5. [x] Create subscriptionStore with Zustand
6. [x] Build paywall screen UI
7. [x] Add feature gating checks throughout app
8. [x] Implement restore purchases (UI ready, needs API keys)
9. [ ] Add Firebase webhook for subscription events
10. [ ] Test on TestFlight / Internal Testing

---

## Revenue Projections (Conservative)

| Scenario | Families | Tier Mix | Monthly Revenue |
|----------|----------|----------|-----------------|
| Launch (3 mo) | 100 | 20% paid | $100 |
| Growth (6 mo) | 500 | 25% paid | $625 |
| Established (12 mo) | 2,000 | 30% paid | $3,000 |

**Break-even costs:**
- Firebase: ~$25/month at 2,000 users
- RevenueCat: Free until $2.5k/month revenue
- Apple/Google: 15-30% commission

---

## Next Session TODO

**Code implementation complete.** Remaining manual steps:

1. Create RevenueCat account at https://www.revenuecat.com
2. Create App Store Connect subscription products:
   - `com.eliherman.thevine.family.monthly` - $4.99
   - `com.eliherman.thevine.family.yearly` - $39.99
   - `com.eliherman.thevine.legacy.monthly` - $9.99
   - `com.eliherman.thevine.legacy.yearly` - $79.99
3. Add RevenueCat API keys to `src/services/purchases.ts`
4. Wire up purchases.ts to paywall.tsx (replace console.log calls)
5. Add subscription sync to Firebase for server-side checks

---

*Created: 2026-02-01*
*Status: Ready for implementation*
