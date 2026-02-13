/**
 * Card.tsx
 *
 * A generic container component that wraps content in a styled card.
 * Supports three visual variants:
 *   - "elevated": white background with a drop shadow (for floating cards)
 *   - "outlined": white background with a thin border (for subtle separation)
 *   - "filled": cream/secondary background color (default, for inline sections)
 *
 * Also supports configurable padding levels (none, sm, md, lg).
 * Used as the base container for feed items, daily verse cards, prompt cards, etc.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
// Import design system tokens for consistent colors, spacing, and border radius
import { colors, spacing, borderRadius } from '../../constants';

/**
 * Props for the Card component.
 * Only `children` is required; variant and padding have sensible defaults.
 */
interface CardProps {
  children: React.ReactNode; // The content to render inside the card
  variant?: 'elevated' | 'outlined' | 'filled'; // Visual style of the card
  padding?: 'none' | 'sm' | 'md' | 'lg'; // Amount of inner padding
  style?: ViewStyle; // Additional styles from the parent component
}

/**
 * Card component - a styled container that wraps child content with
 * a background color, optional shadow or border, and configurable padding.
 *
 * @param children - React nodes to render inside the card
 * @param variant - Visual style: 'elevated' (shadow), 'outlined' (border), 'filled' (colored bg); defaults to 'filled'
 * @param padding - Inner padding: 'none', 'sm', 'md', 'lg'; defaults to 'md'
 * @param style - Optional ViewStyle overrides for the card container
 */
export function Card({
  children,
  variant = 'filled', // Default to the filled variant with a cream background
  padding = 'md', // Default to medium padding
  style,
}: CardProps) {
  return (
    // Compose styles: base shape -> variant appearance -> padding level -> custom overrides
    <View style={[styles.base, styles[variant], styles[`${padding}Padding`], style]}>
      {children}
    </View>
  );
}

/**
 * StyleSheet for the Card component.
 * Organized into: base shape, variant styles, and padding levels.
 */
const styles = StyleSheet.create({
  // Base shape shared by all card variants
  base: {
    borderRadius: borderRadius.lg, // Large rounded corners from the design system
    overflow: 'hidden', // Clip child content to the rounded corners
  },
  // Elevated variant: white card with a subtle drop shadow for a floating effect
  elevated: {
    backgroundColor: colors.background.primary, // White background (Warm White)
    shadowColor: '#000', // Shadow is black
    shadowOffset: { width: 0, height: 4 }, // Shadow drops 4px below the card
    shadowOpacity: 0.08, // Very subtle shadow (8% opacity)
    shadowRadius: 12, // Soft, diffused shadow spread
    elevation: 4, // Android-specific shadow depth (mirrors iOS shadow)
  },
  // Outlined variant: white card with a thin gray border for subtle separation
  outlined: {
    backgroundColor: colors.background.primary, // White background (Warm White)
    borderWidth: 1, // Thin 1px border
    borderColor: colors.gray[200], // Light gray border color
  },
  // Filled variant (default): cream background for inline content sections
  filled: {
    backgroundColor: colors.background.secondary, // Cream background (#F9F7F4)
  },
  // No padding - useful when the card's children manage their own spacing
  nonePadding: {
    padding: 0,
  },
  // Small padding - compact card layout
  smPadding: {
    padding: spacing.sm, // Small spacing value from the design system
  },
  // Medium padding (default) - standard card layout
  mdPadding: {
    padding: spacing.md, // Medium spacing value from the design system
  },
  // Large padding - spacious card layout
  lgPadding: {
    padding: spacing.lg, // Large spacing value from the design system
  },
});
