/**
 * UpgradeBanner.tsx
 *
 * A soft paywall banner component that gently encourages users to upgrade
 * their subscription without blocking access to the current feature.
 * Designed to appear when users approach their usage limits (e.g., at 80%
 * of their member or photo limit).
 *
 * Supports two visual variants:
 *   - "info" (default): Green-tinted banner with a green left border,
 *     used when the user is approaching a limit (80-99% usage).
 *   - "warning": Orange/red-tinted banner with a heart-colored left border,
 *     used when the user has reached or exceeded their limit (100%+ usage).
 *
 * Also exports a helper function `shouldShowUpgradeBanner` that calculates
 * whether and which variant of banner to display based on current usage.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// expo-router for navigation; Href provides type safety for route strings
import { router, Href } from 'expo-router';
// Design system constants for consistent styling across the app
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing, borderRadius } from '../../constants/spacing';

/**
 * Props for the UpgradeBanner component.
 */
interface UpgradeBannerProps {
  title: string; // Bold heading text (e.g., "Almost at your limit")
  description: string; // Supporting text explaining the situation and benefit of upgrading
  variant?: 'warning' | 'info'; // Visual style: 'info' for approaching limit, 'warning' for at/over limit
  onDismiss?: () => void; // Optional callback for the "Later" dismiss button; if omitted, no dismiss button is shown
}

/**
 * UpgradeBanner component - a non-blocking soft paywall banner.
 * Shows a message encouraging the user to upgrade, with an "Upgrade" button
 * that navigates to the paywall screen and an optional "Later" dismiss button.
 *
 * Best used at 80% of limits (e.g., 4/5 members, 40/50 photos).
 *
 * @param title - The banner heading text
 * @param description - Supporting description text
 * @param variant - 'info' (green, default) or 'warning' (red/orange)
 * @param onDismiss - Optional handler for the "Later" button; omit to hide the dismiss option
 */
export function UpgradeBanner({
  title,
  description,
  variant = 'info', // Default to the info (green) variant
  onDismiss,
}: UpgradeBannerProps) {
  // Determine if we should use warning-specific styling
  const isWarning = variant === 'warning';

  return (
    // Outer container: apply base styles, and conditionally overlay warning styles
    <View style={[styles.container, isWarning && styles.containerWarning]}>
      {/* Content section: title and description text */}
      <View style={styles.content}>
        {/* Banner title: conditionally apply warning color (red) instead of default (green) */}
        <Text style={[styles.title, isWarning && styles.titleWarning]}>{title}</Text>
        {/* Banner description with additional context */}
        <Text style={styles.description}>{description}</Text>
      </View>
      {/* Actions row: Upgrade button and optional dismiss button */}
      <View style={styles.actions}>
        {/* "Upgrade" button that navigates to the paywall/subscription plans screen */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push('/paywall' as Href)} // Navigate to the paywall route
          accessibilityRole="button" // Identify as a button for screen readers
          accessibilityLabel="Upgrade" // Screen reader label
          accessibilityHint="Opens subscription plans" // Describe the action result
        >
          <Text style={styles.upgradeButtonText}>Upgrade</Text>
        </TouchableOpacity>
        {/* "Later" dismiss button - only rendered if an onDismiss handler is provided */}
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss} // Call the parent's dismiss handler
            accessibilityRole="button" // Identify as a button for screen readers
            accessibilityLabel="Dismiss upgrade prompt" // Screen reader label
          >
            <Text style={styles.dismissButtonText}>Later</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/**
 * shouldShowUpgradeBanner - a pure helper function that determines whether
 * an upgrade banner should be shown and which variant to use.
 *
 * Logic:
 *   - If the limit is Infinity (unlimited tier), never show a banner ('none')
 *   - If usage is at or above 100% of the limit, show a 'warning' banner
 *   - If usage is at or above 80% of the limit, show an 'info' banner
 *   - Otherwise, show nothing ('none')
 *
 * @param currentCount - The user's current usage count (e.g., number of members added)
 * @param limit - The maximum allowed count for the user's subscription tier
 * @returns 'none' if no banner needed, 'info' for approaching limit, 'warning' for at/over limit
 */
export function shouldShowUpgradeBanner(
  currentCount: number,
  limit: number,
): 'none' | 'info' | 'warning' {
  // Unlimited tiers never need an upgrade banner
  if (limit === Infinity) return 'none';
  // Calculate the usage as a fraction of the limit (e.g., 4/5 = 0.8)
  const percentage = currentCount / limit;
  // At or over the limit: show a warning-level banner
  if (percentage >= 1) return 'warning';
  // Approaching the limit (80%+): show an informational banner
  if (percentage >= 0.8) return 'info';
  // Well under the limit: no banner needed
  return 'none';
}

/**
 * StyleSheet for the UpgradeBanner component.
 * Uses a left-border accent, translucent background colors, and
 * a horizontal button row layout.
 */
const styles = StyleSheet.create({
  // Base container: green-tinted background with a thick left border accent
  container: {
    backgroundColor: colors.primary.light + '15', // Light green at 15% opacity (hex suffix)
    borderRadius: borderRadius.lg, // Large rounded corners
    padding: spacing.md, // Medium inner padding
    borderLeftWidth: 4, // Thick left border for visual accent
    borderLeftColor: colors.primary.main, // Forest green left border
    marginBottom: spacing.md, // Space below the banner
  },
  // Warning variant overrides: orange/red tinted background and border
  containerWarning: {
    backgroundColor: colors.warning + '20', // Warning color at 20% opacity
    borderLeftColor: colors.heart, // Heart/red left border for urgency
  },
  // Content section containing the title and description
  content: {
    marginBottom: spacing.sm, // Space between text content and action buttons
  },
  // Title text: small body text made semi-bold, colored to match the variant
  title: {
    ...typography.textStyles.bodySmall, // Small body text typography preset
    fontWeight: '600', // Semi-bold for emphasis
    color: colors.primary.dark, // Deep forest green color (info variant)
    marginBottom: spacing.xs, // Small space between title and description
  },
  // Warning variant title override: red/heart color for urgency
  titleWarning: {
    color: colors.heart, // Heart red color to signal urgency
  },
  // Description text: caption-sized, muted color
  description: {
    ...typography.textStyles.caption, // Caption typography preset (small text)
    color: colors.text.secondary, // Muted gray text
  },
  // Actions row: horizontal layout for the Upgrade and Later buttons
  actions: {
    flexDirection: 'row', // Lay out buttons side by side
    gap: spacing.sm, // Space between the two buttons
  },
  // "Upgrade" button: solid green with 44px minimum touch target
  upgradeButton: {
    backgroundColor: colors.primary.main, // Forest green background
    paddingVertical: spacing.sm, // Vertical padding
    paddingHorizontal: spacing.md, // Horizontal padding
    minHeight: 44, // Minimum 44px height for accessible touch target
    borderRadius: borderRadius.md, // Medium rounded corners
    justifyContent: 'center', // Vertically center the text
  },
  // Upgrade button text: small, bold, white
  upgradeButtonText: {
    ...typography.textStyles.caption, // Caption typography preset
    fontWeight: '600', // Semi-bold for emphasis
    color: colors.text.inverse, // White text on green background
  },
  // "Later" dismiss button: text-only (no background) with accessible tap target
  dismissButton: {
    paddingVertical: spacing.sm, // Vertical padding for tap target
    paddingHorizontal: spacing.sm, // Horizontal padding for tap target
    minHeight: 44, // Minimum 44px height for accessible touch target
    justifyContent: 'center', // Vertically center the text
  },
  // Dismiss button text: small and muted to de-emphasize compared to Upgrade
  dismissButtonText: {
    ...typography.textStyles.caption, // Caption typography preset
    color: colors.text.tertiary, // Very muted gray to de-emphasize
  },
});
