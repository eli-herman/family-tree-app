/**
 * subscriptionStore.ts - Subscription Store
 *
 * This Zustand store manages the user's subscription tier and provides
 * feature-gating checks for The Vine app's monetization system.
 *
 * The app uses a tiered subscription model (e.g., free, premium, family)
 * where each tier has different limits and feature access. This store:
 *   - Tracks the current subscription tier, status, and expiration
 *   - Provides boolean checks for whether the user can use specific features
 *     (e.g., canAddMember, canRecordAudio, canExport)
 *   - Provides numeric limit getters (e.g., how many members/photos are allowed)
 *   - Calculates remaining capacity (e.g., how many more members can be added)
 *
 * The TIER_LIMITS configuration (imported from types/subscription) defines
 * the specific limits for each subscription tier.
 */

import { create } from 'zustand'; // Zustand is a lightweight state management library for React
import { SubscriptionInfo, TIER_LIMITS } from '../types/subscription'; // SubscriptionInfo = tier/status data; TIER_LIMITS = per-tier feature limits

/**
 * TypeScript interface defining the shape of the subscription store.
 * Extends SubscriptionInfo so the store itself holds all subscription fields
 * (tier, isActive, expiresAt, provider, productId) as top-level state.
 */
interface SubscriptionState extends SubscriptionInfo {
  // --- Actions ---
  setSubscription: (info: Partial<SubscriptionInfo>) => void; // Update subscription fields (e.g., after purchase or restore)
  resetSubscription: () => void; // Reset subscription to the free tier defaults

  // --- Feature Checks (return true if the user is allowed to use the feature) ---
  canAddMember: (currentCount: number) => boolean; // Check if adding another family member is within the tier limit
  canUploadPhoto: (currentCount: number) => boolean; // Check if uploading another photo is within the tier limit
  canRecordAudio: () => boolean; // Check if audio recording is enabled for this tier
  canRecordVideo: () => boolean; // Check if video recording is enabled for this tier
  canArchiveDeceased: () => boolean; // Check if deceased member archiving is enabled for this tier
  canExport: () => boolean; // Check if data export is enabled for this tier

  // --- Limit Getters (return the numeric limits for the current tier) ---
  getMemberLimit: () => number; // Get the maximum number of family members allowed
  getPhotoLimit: () => number; // Get the maximum number of photos allowed
  getRemainingMembers: (currentCount: number) => number; // Calculate how many more members can be added
  getRemainingPhotos: (currentCount: number) => number; // Calculate how many more photos can be uploaded
}

/**
 * The default subscription state representing a new user on the free tier.
 * All users start here and can upgrade through in-app purchases.
 */
const initialState: SubscriptionInfo = {
  tier: 'free', // The subscription tier name (e.g., 'free', 'premium', 'family')
  isActive: true, // Whether the subscription is currently active (free is always active)
  expiresAt: null, // When the subscription expires (null for free tier since it never expires)
  provider: undefined, // The payment provider (e.g., 'revenueCat', 'apple', 'google')
  productId: undefined, // The product ID from the payment provider
};

/**
 * The Zustand subscription store. Created with `create<SubscriptionState>`
 * which provides `set` to update state and `get` to read current state.
 * Components use this store via the `useSubscriptionStore` hook.
 *
 * The store spreads initialState as its starting values, so all SubscriptionInfo
 * fields (tier, isActive, etc.) are directly accessible as top-level state.
 */
export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...initialState, // Spread the initial subscription fields as top-level state

  /**
   * Updates one or more subscription fields.
   * Used when a purchase is completed, a subscription is restored,
   * or the tier changes. Uses spread to merge updates into existing state.
   *
   * @param info - An object containing the subscription fields to update
   */
  setSubscription: (info) =>
    set((state) => ({
      ...state, // Keep all existing state
      ...info, // Override with the provided updates
    })),

  /**
   * Resets the subscription back to the free tier defaults.
   * Used when a subscription expires, is cancelled, or the user logs out.
   */
  resetSubscription: () => set(initialState),

  // --- Feature Checks ---

  /**
   * Checks if the user can add another family member given their current count.
   * Compares the current member count against the tier's maxMembers limit.
   *
   * @param currentCount - The number of family members currently in the family
   * @returns true if the user can add at least one more member
   */
  canAddMember: (currentCount) => {
    const { tier } = get(); // Get the current subscription tier from state
    const limit = TIER_LIMITS[tier].maxMembers; // Look up the member limit for this tier
    return currentCount < limit; // Return true if there is room for more
  },

  /**
   * Checks if the user can upload another photo given their current count.
   * Compares the current photo count against the tier's maxPhotos limit.
   *
   * @param currentCount - The number of photos currently uploaded
   * @returns true if the user can upload at least one more photo
   */
  canUploadPhoto: (currentCount) => {
    const { tier } = get(); // Get the current subscription tier from state
    const limit = TIER_LIMITS[tier].maxPhotos; // Look up the photo limit for this tier
    return currentCount < limit; // Return true if there is room for more
  },

  /**
   * Checks if the current subscription tier allows audio recording.
   * @returns true if audio recording is enabled for this tier
   */
  canRecordAudio: () => {
    const { tier } = get(); // Get the current subscription tier from state
    return TIER_LIMITS[tier].canRecordAudio; // Return the boolean flag from tier limits
  },

  /**
   * Checks if the current subscription tier allows video recording.
   * @returns true if video recording is enabled for this tier
   */
  canRecordVideo: () => {
    const { tier } = get(); // Get the current subscription tier from state
    return TIER_LIMITS[tier].canRecordVideo; // Return the boolean flag from tier limits
  },

  /**
   * Checks if the current subscription tier allows archiving deceased members.
   * Archiving preserves their data with special memorial formatting.
   * @returns true if deceased member archiving is enabled for this tier
   */
  canArchiveDeceased: () => {
    const { tier } = get(); // Get the current subscription tier from state
    return TIER_LIMITS[tier].canArchiveDeceased; // Return the boolean flag from tier limits
  },

  /**
   * Checks if the current subscription tier allows data export.
   * Export lets users download their family data (e.g., as PDF or GEDCOM).
   * @returns true if data export is enabled for this tier
   */
  canExport: () => {
    const { tier } = get(); // Get the current subscription tier from state
    return TIER_LIMITS[tier].canExport; // Return the boolean flag from tier limits
  },

  // --- Limit Getters ---

  /**
   * Returns the maximum number of family members allowed for the current tier.
   * @returns The member limit (may be Infinity for unlimited tiers)
   */
  getMemberLimit: () => {
    const { tier } = get(); // Get the current subscription tier from state
    return TIER_LIMITS[tier].maxMembers; // Return the numeric limit
  },

  /**
   * Returns the maximum number of photos allowed for the current tier.
   * @returns The photo limit (may be Infinity for unlimited tiers)
   */
  getPhotoLimit: () => {
    const { tier } = get(); // Get the current subscription tier from state
    return TIER_LIMITS[tier].maxPhotos; // Return the numeric limit
  },

  /**
   * Calculates how many more family members can be added before hitting the tier limit.
   * Returns Infinity if the tier has no member limit.
   * Returns 0 if the limit has been reached (never returns negative).
   *
   * @param currentCount - The number of family members currently in the family
   * @returns The number of additional members that can be added
   */
  getRemainingMembers: (currentCount) => {
    const { tier } = get(); // Get the current subscription tier from state
    const limit = TIER_LIMITS[tier].maxMembers; // Look up the member limit for this tier
    if (limit === Infinity) return Infinity; // Unlimited tier — always return Infinity
    return Math.max(0, limit - currentCount); // Subtract current from limit, but never go below 0
  },

  /**
   * Calculates how many more photos can be uploaded before hitting the tier limit.
   * Returns Infinity if the tier has no photo limit.
   * Returns 0 if the limit has been reached (never returns negative).
   *
   * @param currentCount - The number of photos currently uploaded
   * @returns The number of additional photos that can be uploaded
   */
  getRemainingPhotos: (currentCount) => {
    const { tier } = get(); // Get the current subscription tier from state
    const limit = TIER_LIMITS[tier].maxPhotos; // Look up the photo limit for this tier
    if (limit === Infinity) return Infinity; // Unlimited tier — always return Infinity
    return Math.max(0, limit - currentCount); // Subtract current from limit, but never go below 0
  },
}));
