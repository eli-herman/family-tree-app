import { create } from 'zustand';
import {
  SubscriptionTier,
  SubscriptionInfo,
  TIER_LIMITS,
} from '../types/subscription';

interface SubscriptionState extends SubscriptionInfo {
  // Actions
  setSubscription: (info: Partial<SubscriptionInfo>) => void;
  resetSubscription: () => void;

  // Feature checks
  canAddMember: (currentCount: number) => boolean;
  canUploadPhoto: (currentCount: number) => boolean;
  canRecordAudio: () => boolean;
  canRecordVideo: () => boolean;
  canArchiveDeceased: () => boolean;
  canExport: () => boolean;

  // Limit getters
  getMemberLimit: () => number;
  getPhotoLimit: () => number;
  getRemainingMembers: (currentCount: number) => number;
  getRemainingPhotos: (currentCount: number) => number;
}

const initialState: SubscriptionInfo = {
  tier: 'free',
  isActive: true,
  expiresAt: null,
  provider: undefined,
  productId: undefined,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...initialState,

  setSubscription: (info) =>
    set((state) => ({
      ...state,
      ...info,
    })),

  resetSubscription: () => set(initialState),

  // Feature checks
  canAddMember: (currentCount) => {
    const { tier } = get();
    const limit = TIER_LIMITS[tier].maxMembers;
    return currentCount < limit;
  },

  canUploadPhoto: (currentCount) => {
    const { tier } = get();
    const limit = TIER_LIMITS[tier].maxPhotos;
    return currentCount < limit;
  },

  canRecordAudio: () => {
    const { tier } = get();
    return TIER_LIMITS[tier].canRecordAudio;
  },

  canRecordVideo: () => {
    const { tier } = get();
    return TIER_LIMITS[tier].canRecordVideo;
  },

  canArchiveDeceased: () => {
    const { tier } = get();
    return TIER_LIMITS[tier].canArchiveDeceased;
  },

  canExport: () => {
    const { tier } = get();
    return TIER_LIMITS[tier].canExport;
  },

  // Limit getters
  getMemberLimit: () => {
    const { tier } = get();
    return TIER_LIMITS[tier].maxMembers;
  },

  getPhotoLimit: () => {
    const { tier } = get();
    return TIER_LIMITS[tier].maxPhotos;
  },

  getRemainingMembers: (currentCount) => {
    const { tier } = get();
    const limit = TIER_LIMITS[tier].maxMembers;
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentCount);
  },

  getRemainingPhotos: (currentCount) => {
    const { tier } = get();
    const limit = TIER_LIMITS[tier].maxPhotos;
    if (limit === Infinity) return Infinity;
    return Math.max(0, limit - currentCount);
  },
}));
