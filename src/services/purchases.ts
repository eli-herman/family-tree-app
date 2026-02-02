import Purchases, {
  CustomerInfo,
  PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { SubscriptionTier, SubscriptionInfo } from '../types/subscription';

// TODO: Replace with your RevenueCat API keys
const REVENUECAT_API_KEY_IOS = 'your_revenuecat_ios_key';
const REVENUECAT_API_KEY_ANDROID = 'your_revenuecat_android_key';

// Entitlement IDs from RevenueCat dashboard
const ENTITLEMENT_FAMILY = 'family';
const ENTITLEMENT_LEGACY = 'legacy';

/**
 * Initialize RevenueCat SDK
 * Call this once at app startup
 */
export async function initializePurchases(userId?: string): Promise<void> {
  const apiKey = Platform.select({
    ios: REVENUECAT_API_KEY_IOS,
    android: REVENUECAT_API_KEY_ANDROID,
    default: REVENUECAT_API_KEY_IOS,
  });

  await Purchases.configure({ apiKey });

  if (userId) {
    await Purchases.logIn(userId);
  }
}

/**
 * Get current customer subscription info
 */
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

/**
 * Get available packages/products for purchase
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (error) {
    console.error('Error getting offerings:', error);
    return [];
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<SubscriptionInfo> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return parseCustomerInfo(customerInfo);
  } catch (error: any) {
    if (error.userCancelled) {
      throw new Error('Purchase cancelled');
    }
    throw error;
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<SubscriptionInfo> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
}

/**
 * Parse RevenueCat CustomerInfo into our SubscriptionInfo
 */
function parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
  const entitlements = customerInfo.entitlements.active;

  // Check for Legacy tier first (higher tier)
  if (entitlements[ENTITLEMENT_LEGACY]) {
    const legacy = entitlements[ENTITLEMENT_LEGACY];
    const storeStr = String(legacy.store).toLowerCase();
    return {
      tier: 'legacy',
      isActive: true,
      expiresAt: legacy.expirationDate ? new Date(legacy.expirationDate) : null,
      provider: storeStr.includes('apple') || storeStr.includes('app_store') ? 'apple' : 'google',
      productId: legacy.productIdentifier,
    };
  }

  // Check for Family tier
  if (entitlements[ENTITLEMENT_FAMILY]) {
    const family = entitlements[ENTITLEMENT_FAMILY];
    const storeStr = String(family.store).toLowerCase();
    return {
      tier: 'family',
      isActive: true,
      expiresAt: family.expirationDate ? new Date(family.expirationDate) : null,
      provider: storeStr.includes('apple') || storeStr.includes('app_store') ? 'apple' : 'google',
      productId: family.productIdentifier,
    };
  }

  // Default to free tier
  return {
    tier: 'free',
    isActive: true,
    expiresAt: null,
  };
}

/**
 * Map product ID to tier
 */
export function getTierFromProductId(productId: string): SubscriptionTier {
  if (productId.includes('legacy')) {
    return 'legacy';
  }
  if (productId.includes('family')) {
    return 'family';
  }
  return 'free';
}
