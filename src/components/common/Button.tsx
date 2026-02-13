/**
 * Button.tsx
 *
 * A reusable button component with support for multiple visual variants
 * (primary, secondary, outline, ghost) and sizes (sm, md, lg).
 * Includes built-in loading state with a spinner, disabled state styling,
 * and full accessibility support (role, label, hint, state).
 *
 * Used throughout the app for actions like "Edit Profile", "Share a memory",
 * "Try again", "Upgrade", etc.
 */

import React from 'react';
import {
  TouchableOpacity, // Pressable wrapper that provides visual feedback on touch
  Text,
  StyleSheet,
  ViewStyle, // Type for styling View-based components
  TextStyle, // Type for styling Text components
  ActivityIndicator, // Native spinning loader indicator
} from 'react-native';
// Import design system tokens: colors, typography, spacing, and border radius values
import { colors, typography, spacing, borderRadius } from '../../constants';

/**
 * Props for the Button component.
 * Only `title` and `onPress` are required; everything else has sensible defaults.
 */
interface ButtonProps {
  title: string; // The text label displayed inside the button
  onPress: () => void; // Callback function invoked when the button is pressed
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; // Visual style variant
  size?: 'sm' | 'md' | 'lg'; // Controls padding and minimum height
  disabled?: boolean; // When true, dims the button and prevents interaction
  loading?: boolean; // When true, shows a spinner instead of the title text
  style?: ViewStyle; // Additional styles for the outer TouchableOpacity container
  textStyle?: TextStyle; // Additional styles for the inner Text element
  accessibilityLabel?: string; // Screen reader label (defaults to title if not provided)
  accessibilityHint?: string; // Screen reader hint describing what happens on press
}

/**
 * Button component - a configurable, accessible button with multiple variants.
 *
 * @param title - The button's visible text label
 * @param onPress - Handler called when the user taps the button
 * @param variant - Visual style: 'primary' (filled green), 'secondary' (gray bg),
 *                  'outline' (green border, transparent bg), 'ghost' (no bg or border)
 * @param size - Determines padding and min height: 'sm' (36px), 'md' (48px), 'lg' (56px)
 * @param disabled - Reduces opacity and prevents press events when true
 * @param loading - Replaces the title text with a spinning ActivityIndicator when true
 * @param style - Optional ViewStyle overrides for the button container
 * @param textStyle - Optional TextStyle overrides for the button label
 * @param accessibilityLabel - Override for the screen reader label (defaults to title)
 * @param accessibilityHint - Describes the result of pressing the button for screen readers
 */
export function Button({
  title,
  onPress,
  variant = 'primary', // Default to the primary (filled green) style
  size = 'md', // Default to medium size
  disabled = false, // Not disabled by default
  loading = false, // Not loading by default
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  /**
   * Build the array of styles for the button container.
   * Styles are merged in order: base -> variant -> size -> disabled -> custom.
   * False values (when disabled is false) are filtered out by React Native.
   */
  const buttonStyles = [
    styles.base, // Base layout styles (centered content, rounded corners)
    styles[variant], // Variant-specific background color and border
    styles[`${size}Size`], // Size-specific padding and minimum height
    disabled && styles.disabled, // Conditionally apply reduced opacity when disabled
    style, // Any custom styles passed from the parent component
  ];

  /**
   * Build the array of styles for the button text.
   * Styles are merged in order: base text -> variant text -> size text -> disabled -> custom.
   */
  const textStyles = [
    styles.text, // Base text styles from the typography system
    styles[`${variant}Text`], // Variant-specific text color
    styles[`${size}Text`], // Size-specific font size
    disabled && styles.disabledText, // Conditionally apply reduced text opacity when disabled
    textStyle, // Any custom text styles passed from the parent component
  ];

  return (
    <TouchableOpacity
      style={buttonStyles} // Apply the composed button container styles
      onPress={onPress} // Attach the press handler callback
      disabled={disabled || loading} // Disable interaction when button is disabled or loading
      activeOpacity={0.8} // Slightly dim the button on press (80% opacity) for touch feedback
      accessibilityRole="button" // Tell screen readers this element is a button
      accessibilityLabel={accessibilityLabel || title} // Use custom label or fall back to title text
      accessibilityHint={accessibilityHint} // Describe the action for screen reader users
      accessibilityState={{ disabled: disabled || loading, busy: loading }} // Communicate state to assistive tech
    >
      {loading ? (
        // When loading, show a spinning indicator instead of the button text
        <ActivityIndicator
          color={variant === 'primary' ? colors.text.inverse : colors.primary.main} // White spinner on primary, green on others
          size="small" // Use the small native spinner size
        />
      ) : (
        // When not loading, render the button title text
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * StyleSheet for the Button component.
 * Organized into groups: base layout, variant backgrounds, size dimensions,
 * disabled states, text base, variant text colors, size text, and disabled text.
 */
const styles = StyleSheet.create({
  // Base layout shared by all button variants
  base: {
    alignItems: 'center', // Center text/spinner horizontally
    justifyContent: 'center', // Center text/spinner vertically
    borderRadius: borderRadius.md, // Rounded corners from the design system
  },
  // Primary variant: solid forest green background
  primary: {
    backgroundColor: colors.primary.main, // Forest green (#2D6A4F)
  },
  // Secondary variant: light gray background
  secondary: {
    backgroundColor: colors.background.tertiary, // Subtle gray background
  },
  // Outline variant: transparent background with a green border
  outline: {
    backgroundColor: 'transparent', // No background fill
    borderWidth: 2, // Visible border stroke
    borderColor: colors.primary.main, // Forest green border color
  },
  // Ghost variant: completely transparent, no border or background
  ghost: {
    backgroundColor: 'transparent', // Invisible background
  },
  // Small size: compact padding and 36px minimum tap target
  smSize: {
    paddingVertical: spacing.xs, // Small vertical padding
    paddingHorizontal: spacing.md, // Medium horizontal padding
    minHeight: 36, // Minimum height for touch target
  },
  // Medium size (default): standard padding and 48px minimum tap target
  mdSize: {
    paddingVertical: 14, // 14px vertical padding
    paddingHorizontal: spacing.lg, // Large horizontal padding
    minHeight: 48, // Standard button height for comfortable tapping
  },
  // Large size: generous padding and 56px minimum tap target
  lgSize: {
    paddingVertical: spacing.md, // Medium vertical padding
    paddingHorizontal: spacing.xl, // Extra large horizontal padding
    minHeight: 56, // Tall button for prominent CTAs
  },
  // Disabled state: reduces overall button opacity to appear grayed out
  disabled: {
    opacity: 0.5, // Half opacity to visually indicate non-interactive state
  },
  // Base text style: uses the button typography preset from the design system
  text: {
    ...typography.textStyles.button, // Spread in font family, size, weight, letter spacing
  },
  // Primary variant text: white text to contrast against green background
  primaryText: {
    color: colors.text.inverse, // White text
  },
  // Secondary variant text: dark text on the light gray background
  secondaryText: {
    color: colors.text.primary, // Dark text
  },
  // Outline variant text: green text matching the border color
  outlineText: {
    color: colors.primary.main, // Forest green text
  },
  // Ghost variant text: green text on transparent background
  ghostText: {
    color: colors.primary.main, // Forest green text
  },
  // Small text: uses the smaller button typography preset
  smText: {
    ...typography.textStyles.buttonSmall, // Smaller font size for compact buttons
  },
  // Medium text: uses the standard button typography preset
  mdText: {
    ...typography.textStyles.button, // Standard font size
  },
  // Large text: extends standard button typography with a larger font size
  lgText: {
    ...typography.textStyles.button, // Base button typography
    fontSize: 18, // Override to a larger font size for prominent buttons
  },
  // Disabled text: slightly reduces text opacity in addition to the container opacity
  disabledText: {
    opacity: 0.7, // Further dim the text when disabled
  },
});
