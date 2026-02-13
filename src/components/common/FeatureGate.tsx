/**
 * FeatureGate.tsx
 *
 * Subscription-based feature gating component and companion hook.
 * Wraps content that may be restricted based on the user's subscription tier.
 *
 * How it works:
 *   1. Checks the user's subscription via the useSubscriptionStore Zustand store.
 *   2. If the feature is unlocked for their tier, renders the children normally.
 *   3. If the feature is locked, renders either:
 *      a. A custom locked view provided via the renderLocked prop, or
 *      b. The built-in DefaultLockedView showing a lock icon, message, and "View Plans" button.
 *
 * Supported gated features:
 *   - addMember: Adding family members (subject to member count limits)
 *   - uploadPhoto: Uploading photos (subject to photo count limits)
 *   - recordAudio: Recording audio memories (tier-gated)
 *   - recordVideo: Recording video memories (tier-gated)
 *   - archiveDeceased: Archiving deceased family members (tier-gated)
 *   - export: Exporting family data (tier-gated)
 *
 * Also exports the useFeatureAccess hook for checking feature availability
 * without rendering a gate wrapper (useful for conditionally showing buttons).
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// expo-router provides type-safe navigation; Href is the type for route paths
import { router, Href } from 'expo-router';
// Zustand store that manages subscription state (tier, limits, capabilities)
import { useSubscriptionStore } from '../../stores';
// Design system constants for consistent styling
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

/**
 * Union type defining all features that can be gated by subscription tier.
 * Each feature corresponds to a capability check in the subscription store.
 */
type FeatureType =
  | 'addMember' // Adding new family members to the tree
  | 'uploadPhoto' // Uploading photos to feed or profiles
  | 'recordAudio' // Recording audio story memories
  | 'recordVideo' // Recording video memories
  | 'archiveDeceased' // Archiving deceased family members as memorials
  | 'export'; // Exporting family tree data

/**
 * Props for the FeatureGate component.
 */
interface FeatureGateProps {
  feature: FeatureType; // Which feature to check access for
  currentCount?: number; // Current usage count for countable features (e.g., number of members or photos)
  children: React.ReactNode; // Content to render when the feature is unlocked
  renderLocked?: () => React.ReactNode; // Optional custom UI to show when the feature is locked
}

/**
 * FeatureGate component - conditionally renders children based on subscription access.
 * Wraps content that requires a subscription feature. If the feature is available,
 * renders children. If locked, shows an upgrade prompt or custom locked content.
 *
 * @param feature - The feature to check access for
 * @param currentCount - Current usage count for features with numeric limits (defaults to 0)
 * @param children - Content to render when the feature is available
 * @param renderLocked - Optional function returning custom UI for the locked state
 */
export function FeatureGate({
  feature,
  currentCount = 0, // Default to 0 for features without count-based limits
  children,
  renderLocked,
}: FeatureGateProps) {
  // Access the subscription store to check feature capabilities
  const store = useSubscriptionStore();

  /**
   * Checks whether the requested feature is available based on the current
   * subscription tier and usage counts. Uses a switch statement to route
   * each feature type to its corresponding store method.
   *
   * @returns true if the feature is unlocked and available, false if gated
   */
  const isUnlocked = (): boolean => {
    switch (feature) {
      case 'addMember':
        // Check if the member limit has not been reached
        return store.canAddMember(currentCount);
      case 'uploadPhoto':
        // Check if the photo limit has not been reached
        return store.canUploadPhoto(currentCount);
      case 'recordAudio':
        // Check if audio recording is available on the current tier
        return store.canRecordAudio();
      case 'recordVideo':
        // Check if video recording is available on the current tier
        return store.canRecordVideo();
      case 'archiveDeceased':
        // Check if memorial archiving is available on the current tier
        return store.canArchiveDeceased();
      case 'export':
        // Check if data export is available on the current tier
        return store.canExport();
      default:
        // Unknown features default to unlocked (fail-open)
        return true;
    }
  };

  // If the feature is unlocked, render the children content normally
  if (isUnlocked()) {
    return <>{children}</>;
  }

  // If a custom locked renderer was provided, use it instead of the default
  if (renderLocked) {
    return <>{renderLocked()}</>;
  }

  // Fall back to the built-in locked view with feature-specific messaging
  return <DefaultLockedView feature={feature} />;
}

/**
 * Props for the DefaultLockedView internal component.
 */
interface DefaultLockedViewProps {
  feature: FeatureType; // The locked feature, used to determine the message shown
}

/**
 * DefaultLockedView - internal component that displays a lock icon, a feature-specific
 * title and description, and a "View Plans" button that navigates to the paywall screen.
 * This is the fallback UI shown when FeatureGate's renderLocked prop is not provided.
 *
 * @param feature - The feature type to generate contextual messaging for
 */
function DefaultLockedView({ feature }: DefaultLockedViewProps) {
  /**
   * Returns a user-friendly title and description based on which feature is locked.
   * Each message explains what the user is missing and encourages upgrading.
   */
  const getFeatureMessage = (): { title: string; description: string } => {
    switch (feature) {
      case 'addMember':
        return {
          title: 'Family limit reached',
          description: 'Upgrade to add unlimited family members',
        };
      case 'uploadPhoto':
        return {
          title: 'Photo limit reached',
          description: 'Upgrade for unlimited photo storage',
        };
      case 'recordAudio':
        return {
          title: 'Audio memories',
          description: 'Upgrade to record voice messages and stories',
        };
      case 'recordVideo':
        return {
          title: 'Video memories',
          description: 'Upgrade to Legacy for video recordings',
        };
      case 'archiveDeceased':
        return {
          title: 'Memorial archives',
          description: 'Upgrade to preserve memories of loved ones passed',
        };
      case 'export':
        return {
          title: 'Export & backup',
          description: 'Upgrade to Legacy to export your family data',
        };
      default:
        return {
          title: 'Premium feature',
          description: 'Upgrade to unlock this feature',
        };
    }
  };

  // Destructure the title and description for the locked feature
  const { title, description } = getFeatureMessage();

  return (
    // Container with a dashed border to visually indicate a locked/unavailable area
    <View style={styles.container}>
      {/* Lock emoji icon to visually communicate restricted access */}
      <Text style={styles.lockIcon}>🔒</Text>
      {/* Feature-specific title explaining what is locked */}
      <Text style={styles.title}>{title}</Text>
      {/* Description encouraging the user to upgrade */}
      <Text style={styles.description}>{description}</Text>
      {/* Button that navigates to the paywall/subscription plans screen */}
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => router.push('/paywall' as Href)} // Navigate to the paywall route
        accessibilityRole="button" // Identify as a button for screen readers
        accessibilityLabel="View plans" // Screen reader label
        accessibilityHint="Opens subscription plans" // Describe the action
      >
        <Text style={styles.upgradeButtonText}>View Plans</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * useFeatureAccess hook - provides access to subscription feature checks
 * without requiring the FeatureGate wrapper component.
 *
 * Useful for conditionally rendering UI elements (like showing/hiding buttons)
 * based on subscription tier, without needing to wrap content in a gate.
 *
 * @returns An object with capability-check functions, the current tier, and numeric limits
 */
export function useFeatureAccess() {
  // Access the subscription store for all capability checks
  const store = useSubscriptionStore();

  return {
    canAddMember: store.canAddMember, // Function: (count: number) => boolean
    canUploadPhoto: store.canUploadPhoto, // Function: (count: number) => boolean
    canRecordAudio: store.canRecordAudio, // Function: () => boolean
    canRecordVideo: store.canRecordVideo, // Function: () => boolean
    canArchiveDeceased: store.canArchiveDeceased, // Function: () => boolean
    canExport: store.canExport, // Function: () => boolean
    tier: store.tier, // Current subscription tier (e.g., 'free', 'family', 'legacy')
    memberLimit: store.getMemberLimit(), // Numeric limit for family members on current tier
    photoLimit: store.getPhotoLimit(), // Numeric limit for photos on current tier
  };
}

/**
 * StyleSheet for the DefaultLockedView component.
 * Uses a dashed border and centered layout to clearly indicate a locked feature area.
 */
const styles = StyleSheet.create({
  // Outer container with dashed border to indicate a restricted/locked area
  container: {
    padding: spacing.lg, // Generous inner padding
    alignItems: 'center', // Center all content horizontally
    backgroundColor: colors.background.tertiary, // Subtle gray background
    borderRadius: borderRadius.lg, // Large rounded corners
    borderWidth: 1, // Thin border
    borderColor: colors.gray[200], // Light gray border color
    borderStyle: 'dashed', // Dashed border style signals "placeholder" or "locked"
  },
  // Lock emoji displayed at the top of the locked view
  lockIcon: {
    fontSize: 32, // Large emoji size for visual prominence
    marginBottom: spacing.sm, // Space between icon and title
  },
  // Feature title (e.g., "Family limit reached")
  title: {
    ...typography.textStyles.h4, // Heading 4 typography preset
    color: colors.text.primary, // Dark text color for prominence
    marginBottom: spacing.xs, // Small space between title and description
    textAlign: 'center', // Center-align the title
  },
  // Feature description encouraging upgrade
  description: {
    ...typography.textStyles.bodySmall, // Small body text typography preset
    color: colors.text.secondary, // Muted gray text
    textAlign: 'center', // Center-align the description
    marginBottom: spacing.md, // Space between description and button
  },
  // "View Plans" button styled with the primary forest green color
  upgradeButton: {
    backgroundColor: colors.primary.main, // Forest green background
    paddingVertical: spacing.sm, // Vertical padding for tap target
    paddingHorizontal: spacing.lg, // Horizontal padding for text spacing
    borderRadius: borderRadius.lg, // Rounded button corners
  },
  // Button text: white on green background
  upgradeButtonText: {
    ...typography.textStyles.buttonSmall, // Small button text typography preset
    color: colors.text.inverse, // White text for contrast
  },
});
