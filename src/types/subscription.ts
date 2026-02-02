export type SubscriptionTier = 'free' | 'family' | 'legacy';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt: Date | null;
  provider?: 'apple' | 'google';
  productId?: string;
}

export interface TierLimits {
  maxMembers: number;
  maxPhotos: number;
  canRecordAudio: boolean;
  canRecordVideo: boolean;
  canArchiveDeceased: boolean;
  canExport: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxMembers: 5,
    maxPhotos: 50,
    canRecordAudio: false,
    canRecordVideo: false,
    canArchiveDeceased: false,
    canExport: false,
  },
  family: {
    maxMembers: Infinity,
    maxPhotos: Infinity,
    canRecordAudio: true,
    canRecordVideo: false,
    canArchiveDeceased: true,
    canExport: false,
  },
  legacy: {
    maxMembers: Infinity,
    maxPhotos: Infinity,
    canRecordAudio: true,
    canRecordVideo: true,
    canArchiveDeceased: true,
    canExport: true,
  },
};

export interface SubscriptionProduct {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: string;
  period: 'monthly' | 'yearly';
  savings?: string;
}

export const PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'com.eliherman.thevine.family.monthly',
    tier: 'family',
    name: 'Family Monthly',
    price: '$4.99',
    period: 'monthly',
  },
  {
    id: 'com.eliherman.thevine.family.yearly',
    tier: 'family',
    name: 'Family Yearly',
    price: '$39.99',
    period: 'yearly',
    savings: 'Save 33%',
  },
  {
    id: 'com.eliherman.thevine.legacy.monthly',
    tier: 'legacy',
    name: 'Legacy Monthly',
    price: '$9.99',
    period: 'monthly',
  },
  {
    id: 'com.eliherman.thevine.legacy.yearly',
    tier: 'legacy',
    name: 'Legacy Yearly',
    price: '$79.99',
    period: 'yearly',
    savings: 'Save 33%',
  },
];
