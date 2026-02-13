/**
 * Subscription Tiers, Limits, and Product Definitions
 *
 * This file defines the monetization model for The Vine app.
 * There are three subscription tiers:
 * - Free: basic access with limited members and photos
 * - Family ($4.99/mo or $39.99/yr): unlimited members/photos, audio recording, deceased archiving
 * - Legacy ($9.99/mo or $79.99/yr): everything in Family plus video recording and data export
 *
 * TIER_LIMITS defines what each tier can do (feature gating).
 * PRODUCTS defines the purchasable items shown in the subscription screen.
 * These product IDs must match the ones configured in RevenueCat and the App Store / Play Store.
 */

/**
 * SubscriptionTier - The three pricing tiers available in the app.
 * 'free' = no subscription, limited features
 * 'family' = mid-tier subscription with expanded features
 * 'legacy' = premium subscription with all features unlocked
 */
export type SubscriptionTier = 'free' | 'family' | 'legacy';

/**
 * SubscriptionInfo - Describes the current user's subscription state.
 * This is what the app checks to determine which features to enable or disable.
 */
export interface SubscriptionInfo {
  tier: SubscriptionTier; // Which tier the user is currently on (free, family, or legacy)
  isActive: boolean; // Whether the subscription is currently active (true even for free tier)
  expiresAt: Date | null; // When the subscription expires (null for free tier since it never expires)
  provider?: 'apple' | 'google'; // Which app store the subscription was purchased through
  productId?: string; // The specific product identifier from RevenueCat (e.g., "com.eliherman.thevine.family.monthly")
}

/**
 * TierLimits - Defines the feature limits and capabilities for each subscription tier.
 * The app checks these values to gate features (e.g., showing an upgrade prompt
 * when a free user tries to add a 6th family member).
 */
export interface TierLimits {
  maxMembers: number; // Maximum number of family members allowed in the tree (Infinity = unlimited)
  maxPhotos: number; // Maximum number of photos that can be uploaded (Infinity = unlimited)
  canRecordAudio: boolean; // Whether the user can record audio memories
  canRecordVideo: boolean; // Whether the user can record video memories
  canArchiveDeceased: boolean; // Whether the user can archive deceased family members with special memorial features
  canExport: boolean; // Whether the user can export their family tree data
}

/**
 * TIER_LIMITS - A lookup table mapping each subscription tier to its feature limits.
 * Use this like: TIER_LIMITS['free'].maxMembers => 5
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  // Free tier: basic access, suitable for trying the app
  free: {
    maxMembers: 5, // Can add up to 5 family members
    maxPhotos: 50, // Can upload up to 50 photos total
    canRecordAudio: false, // Audio recording is locked
    canRecordVideo: false, // Video recording is locked
    canArchiveDeceased: false, // Deceased member archiving is locked
    canExport: false, // Data export is locked
  },
  // Family tier: expanded access for active families
  family: {
    maxMembers: Infinity, // Unlimited family members
    maxPhotos: Infinity, // Unlimited photo uploads
    canRecordAudio: true, // Can record audio memories
    canRecordVideo: false, // Video recording is still locked (Legacy only)
    canArchiveDeceased: true, // Can archive deceased members with memorial features
    canExport: false, // Data export is still locked (Legacy only)
  },
  // Legacy tier: full access with every feature unlocked
  legacy: {
    maxMembers: Infinity, // Unlimited family members
    maxPhotos: Infinity, // Unlimited photo uploads
    canRecordAudio: true, // Can record audio memories
    canRecordVideo: true, // Can record video memories
    canArchiveDeceased: true, // Can archive deceased members with memorial features
    canExport: true, // Can export family tree data (PDF, JSON, etc.)
  },
};

/**
 * SubscriptionProduct - Describes a purchasable subscription product.
 * These are displayed in the subscription/paywall screen so the user
 * can choose which plan to buy.
 */
export interface SubscriptionProduct {
  id: string; // The product identifier string (must match RevenueCat + App Store / Play Store)
  tier: SubscriptionTier; // Which tier this product grants access to
  name: string; // Human-readable name shown in the UI (e.g., "Family Monthly")
  price: string; // Formatted price string shown to the user (e.g., "$4.99")
  period: 'monthly' | 'yearly'; // Billing period for this product
  savings?: string; // Optional promotional text for yearly plans (e.g., "Save 33%")
}

/**
 * PRODUCTS - The full list of purchasable subscription products.
 * These are shown in the subscription screen. Each product has a unique
 * reverse-domain ID that must match the App Store Connect / Google Play Console
 * and RevenueCat dashboard configurations.
 */
export const PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'com.eliherman.thevine.family.monthly', // App Store / Play Store product ID for Family monthly
    tier: 'family', // Grants access to the Family tier
    name: 'Family Monthly', // Display name in the UI
    price: '$4.99', // Monthly price
    period: 'monthly', // Billed every month
  },
  {
    id: 'com.eliherman.thevine.family.yearly', // App Store / Play Store product ID for Family yearly
    tier: 'family', // Grants access to the Family tier
    name: 'Family Yearly', // Display name in the UI
    price: '$39.99', // Annual price (equivalent to ~$3.33/month)
    period: 'yearly', // Billed once per year
    savings: 'Save 33%', // Promotional text highlighting the discount vs monthly
  },
  {
    id: 'com.eliherman.thevine.legacy.monthly', // App Store / Play Store product ID for Legacy monthly
    tier: 'legacy', // Grants access to the Legacy tier
    name: 'Legacy Monthly', // Display name in the UI
    price: '$9.99', // Monthly price
    period: 'monthly', // Billed every month
  },
  {
    id: 'com.eliherman.thevine.legacy.yearly', // App Store / Play Store product ID for Legacy yearly
    tier: 'legacy', // Grants access to the Legacy tier
    name: 'Legacy Yearly', // Display name in the UI
    price: '$79.99', // Annual price (equivalent to ~$6.67/month)
    period: 'yearly', // Billed once per year
    savings: 'Save 33%', // Promotional text highlighting the discount vs monthly
  },
];
