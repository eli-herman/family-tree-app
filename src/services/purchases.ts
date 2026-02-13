/**
 * RevenueCat Integration - In-App Purchase Service for The Vine
 *
 * This file wraps the RevenueCat SDK (react-native-purchases) to handle
 * subscription purchases, restoration, and status checking. RevenueCat is a
 * third-party service that simplifies in-app purchases by managing receipts,
 * entitlements, and cross-platform subscription state.
 *
 * Key concepts:
 * - "Entitlements" are permissions granted by a subscription (e.g., 'family', 'legacy')
 * - "Offerings" are the available products/packages a user can buy
 * - "CustomerInfo" is RevenueCat's model for a user's purchase history and active subscriptions
 *
 * The flow is:
 * 1. Call initializePurchases() once at app startup (in _layout.tsx)
 * 2. Call getSubscriptionInfo() to check what tier the user has
 * 3. Call getOfferings() to show available plans on the subscription screen
 * 4. Call purchasePackage() when the user taps "Subscribe"
 * 5. Call restorePurchases() if the user taps "Restore Purchases"
 *
 * All functions return our app's SubscriptionInfo type, converting from
 * RevenueCat's CustomerInfo format using the parseCustomerInfo() helper.
 */

// RevenueCat SDK imports - the main Purchases class and its TypeScript types
import Purchases, {
  CustomerInfo, // RevenueCat's representation of a customer's subscription state
  PurchasesPackage, // A purchasable package (contains product info, price, etc.)
} from 'react-native-purchases';
// Platform import to select the correct API key for iOS vs Android
import { Platform } from 'react-native';
// Our app's subscription types (defined in src/types/subscription.ts)
import { SubscriptionTier, SubscriptionInfo } from '../types/subscription';

// RevenueCat API keys - each platform (iOS/Android) has its own key.
// These are configured in the RevenueCat dashboard and must be replaced
// with real keys before the app can process real purchases.
// TODO: Replace with your RevenueCat API keys
const REVENUECAT_API_KEY_IOS = 'your_revenuecat_ios_key'; // API key for iOS (App Store)
const REVENUECAT_API_KEY_ANDROID = 'your_revenuecat_android_key'; // API key for Android (Play Store)

// Entitlement IDs - these must match the entitlement names configured in the
// RevenueCat dashboard. When a user subscribes, RevenueCat grants these entitlements.
const ENTITLEMENT_FAMILY = 'family'; // Entitlement ID for the Family tier subscription
const ENTITLEMENT_LEGACY = 'legacy'; // Entitlement ID for the Legacy tier subscription

/**
 * Initialize the RevenueCat SDK.
 * This must be called once at app startup before any other purchase functions.
 * It configures the SDK with the platform-specific API key and optionally
 * identifies the user (so their purchases are associated with their account).
 *
 * @param userId - Optional user ID to associate with RevenueCat (typically the Firebase Auth UID)
 */
export async function initializePurchases(userId?: string): Promise<void> {
  // Select the correct API key based on the current platform (iOS or Android)
  const apiKey = Platform.select({
    ios: REVENUECAT_API_KEY_IOS, // Use the iOS key on Apple devices
    android: REVENUECAT_API_KEY_ANDROID, // Use the Android key on Android devices
    default: REVENUECAT_API_KEY_IOS, // Fallback to iOS key for other platforms (e.g., web preview)
  });

  // Configure the RevenueCat SDK with the selected API key
  await Purchases.configure({ apiKey });

  // If a user ID is provided, log the user in so RevenueCat can track their purchases
  // across devices. This links RevenueCat's anonymous ID to our app's user ID.
  if (userId) {
    await Purchases.logIn(userId);
  }
}

/**
 * Get the current user's subscription information.
 * Queries RevenueCat for the user's active entitlements and converts
 * the result into our app's SubscriptionInfo format.
 *
 * @returns The user's current subscription info (tier, expiration, etc.)
 *          Falls back to free tier if there's an error.
 */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  try {
    // Ask RevenueCat for the current customer's subscription data
    const customerInfo = await Purchases.getCustomerInfo();
    // Convert RevenueCat's format into our app's SubscriptionInfo format
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Error getting subscription info:', error);
    // If we can't reach RevenueCat, default to free tier so the app still works
    return {
      tier: 'free',
      isActive: true,
      expiresAt: null,
    };
  }
}

/**
 * Get the available subscription packages/products that the user can purchase.
 * RevenueCat organizes products into "offerings" (groups of packages).
 * The "current" offering is the one actively configured in the RevenueCat dashboard.
 *
 * @returns An array of purchasable packages, or an empty array if none are available
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    // Fetch all offerings from RevenueCat
    const offerings = await Purchases.getOfferings();
    // Return the packages from the current (active) offering, if any exist
    if (offerings.current?.availablePackages) {
      return offerings.current.availablePackages;
    }
    return []; // No packages available
  } catch (error) {
    console.error('Error getting offerings:', error);
    return []; // Return empty array on error so the UI can handle it gracefully
  }
}

/**
 * Purchase a specific subscription package.
 * This triggers the native App Store / Play Store purchase flow (the payment sheet
 * that asks the user to confirm with Face ID, fingerprint, or password).
 *
 * @param pkg - The RevenueCat package to purchase (from getOfferings())
 * @returns The updated subscription info after a successful purchase
 * @throws Error with message 'Purchase cancelled' if the user dismisses the payment sheet
 * @throws The original error for any other failure (network issues, payment declined, etc.)
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<SubscriptionInfo> {
  try {
    // Initiate the purchase flow via the native store (App Store / Play Store)
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    // Convert the updated customer info into our app's format
    return parseCustomerInfo(customerInfo);
  } catch (error: any) {
    // RevenueCat sets a special flag when the user cancels the purchase
    if (error.userCancelled) {
      throw new Error('Purchase cancelled'); // Throw a friendlier error for the UI to catch
    }
    throw error; // Re-throw all other errors (network failure, card declined, etc.)
  }
}

/**
 * Restore previous purchases.
 * This is required by App Store / Play Store guidelines. If a user reinstalls the app
 * or switches devices, they can tap "Restore Purchases" to recover their subscription
 * without paying again. RevenueCat checks the store receipts and reactivates entitlements.
 *
 * @returns The restored subscription info
 * @throws Error if the restore process fails
 */
export async function restorePurchases(): Promise<SubscriptionInfo> {
  try {
    // Ask RevenueCat to check the store for any previous purchases by this user
    const customerInfo = await Purchases.restorePurchases();
    // Convert the restored customer info into our app's format
    return parseCustomerInfo(customerInfo);
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error; // Let the UI show an error message
  }
}

/**
 * Parse RevenueCat's CustomerInfo into our app's SubscriptionInfo format.
 * This is an internal helper that checks which entitlements are active
 * and returns the appropriate tier. It checks Legacy first because it's
 * the higher tier -- if a user somehow has both, they get Legacy.
 *
 * @param customerInfo - The raw CustomerInfo object from RevenueCat
 * @returns Our app's SubscriptionInfo with the appropriate tier, expiration, and provider
 */
function parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
  // Get only the active (non-expired) entitlements from RevenueCat
  const entitlements = customerInfo.entitlements.active;

  // Check for Legacy tier first (it's the highest tier, so it takes priority)
  if (entitlements[ENTITLEMENT_LEGACY]) {
    const legacy = entitlements[ENTITLEMENT_LEGACY]; // The active Legacy entitlement object
    const storeStr = String(legacy.store).toLowerCase(); // Which store it was purchased from (e.g., "APP_STORE", "PLAY_STORE")
    return {
      tier: 'legacy', // User has the Legacy tier
      isActive: true, // The entitlement is active (not expired)
      expiresAt: legacy.expirationDate ? new Date(legacy.expirationDate) : null, // When the subscription expires (null if lifetime)
      provider: storeStr.includes('apple') || storeStr.includes('app_store') ? 'apple' : 'google', // Determine if purchased via Apple or Google
      productId: legacy.productIdentifier, // The specific product ID (e.g., "com.eliherman.thevine.legacy.monthly")
    };
  }

  // Check for Family tier (mid-tier subscription)
  if (entitlements[ENTITLEMENT_FAMILY]) {
    const family = entitlements[ENTITLEMENT_FAMILY]; // The active Family entitlement object
    const storeStr = String(family.store).toLowerCase(); // Which store it was purchased from
    return {
      tier: 'family', // User has the Family tier
      isActive: true, // The entitlement is active
      expiresAt: family.expirationDate ? new Date(family.expirationDate) : null, // Expiration date
      provider: storeStr.includes('apple') || storeStr.includes('app_store') ? 'apple' : 'google', // Apple or Google
      productId: family.productIdentifier, // The specific product ID
    };
  }

  // Default to free tier - no active paid entitlements found
  return {
    tier: 'free', // User is on the free tier
    isActive: true, // Free tier is always "active"
    expiresAt: null, // Free tier never expires
  };
}

/**
 * Map a product ID string to its corresponding subscription tier.
 * This is a utility function that looks at the product ID string
 * (e.g., "com.eliherman.thevine.legacy.monthly") and determines
 * which tier it belongs to based on whether it contains "legacy" or "family".
 *
 * @param productId - The product identifier string from RevenueCat or the app store
 * @returns The subscription tier ('legacy', 'family', or 'free')
 */
export function getTierFromProductId(productId: string): SubscriptionTier {
  // Check for Legacy tier first (higher priority)
  if (productId.includes('legacy')) {
    return 'legacy';
  }
  // Check for Family tier
  if (productId.includes('family')) {
    return 'family';
  }
  // Default to free if the product ID doesn't match any known tier
  return 'free';
}
