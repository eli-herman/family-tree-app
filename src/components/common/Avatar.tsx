/**
 * Avatar.tsx
 *
 * A circular avatar component that displays either a user's profile image
 * or a colored circle with the user's first initial as a fallback.
 * Used throughout the app wherever a family member's picture is shown
 * (feed posts, tree nodes, profile headers, etc.).
 *
 * Supports four sizes (sm, md, lg, xl) and three color variants
 * (green, brown, branch) to visually distinguish different roles or
 * generations in the family tree.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
// expo-image provides a performant Image component with caching and transitions
import { Image } from 'expo-image';
// Import the app's color palette from the design system constants
import { colors } from '../../constants';

/**
 * Props for the Avatar component.
 * All props are optional, allowing a minimal <Avatar /> to render a default state.
 */
interface AvatarProps {
  uri?: string; // URL of the user's profile image (if available)
  name?: string; // User's name, used to derive the fallback initial letter
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Controls the pixel dimensions of the avatar
  variant?: 'green' | 'brown' | 'branch'; // Controls the background color theme
  style?: ViewStyle; // Additional styles that can be passed from the parent component
}

/**
 * Mapping from size names to pixel dimensions.
 * Each size is used as both width and height to create a perfect circle.
 */
const sizes = {
  sm: 32, // Small avatar - used in compact layouts like tree nodes
  md: 44, // Medium avatar - default size, used in feed items and lists
  lg: 56, // Large avatar - used in detailed views like tree nodes at normal scale
  xl: 80, // Extra large avatar - used in profile headers
};

/**
 * Mapping from size names to the font size of the fallback initial letter.
 * Each font size is proportional to the avatar dimension so the letter
 * looks balanced inside the circle.
 */
const fontSizes = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

/**
 * Avatar component - renders a circular avatar with either an image or initial letter.
 *
 * @param uri - Optional image URL; when provided, the image is shown instead of the initial
 * @param name - User's name; the first character is extracted as the fallback initial
 * @param size - One of 'sm', 'md', 'lg', 'xl'; defaults to 'md' (44px)
 * @param variant - Color scheme: 'green', 'brown', or 'branch'; defaults to 'green'
 * @param style - Optional additional ViewStyle to override or extend default styles
 */
export function Avatar({ uri, name, size = 'md', variant = 'green', style }: AvatarProps) {
  // Look up the pixel dimension for the chosen size
  const dimension = sizes[size];
  // Look up the font size for the fallback initial letter
  const fontSize = fontSizes[size];
  // Extract the first character of the name, uppercased; fall back to '?' if no name given
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  /**
   * Color pairs for each variant. The second color ([1]) is used as the
   * solid background color of the avatar circle. The first color ([0])
   * is reserved for potential future gradient support.
   */
  const gradientColors = {
    green: [colors.primary.light, colors.primary.main], // Forest green tones
    brown: [colors.brown.light, colors.brown.main], // Earthy brown tones
    branch: [colors.brown.branch, colors.brown.main], // Branch/vine tones
  };

  return (
    <View
      style={[
        styles.container, // Base styles: overflow hidden, centered content
        {
          width: dimension, // Set the width based on the size prop
          height: dimension, // Set the height to match width (square)
          borderRadius: dimension / 2, // Half of dimension creates a perfect circle
          backgroundColor: gradientColors[variant][1], // Use the darker color from the variant pair
        },
        style, // Merge in any custom styles passed by the parent
      ]}
    >
      {uri ? (
        // When an image URI is provided, render the user's profile photo
        <Image
          source={{ uri }} // Set the remote image URL as the source
          style={[styles.image, { borderRadius: dimension / 2 }]} // Make image circular too
          contentFit="cover" // Crop the image to fill the circle without distortion
          transition={200} // 200ms fade-in animation when the image loads
        />
      ) : (
        // When no image URI is provided, show the first letter of the user's name
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      )}
    </View>
  );
}

/**
 * StyleSheet for the Avatar component.
 * Styles are created once at module load time using StyleSheet.create
 * for optimal performance in React Native.
 */
const styles = StyleSheet.create({
  // Base container style for the circular avatar wrapper
  container: {
    overflow: 'hidden', // Clip the image to the circular boundary
    alignItems: 'center', // Center the initial letter horizontally
    justifyContent: 'center', // Center the initial letter vertically
  },
  // Style for the profile image when a URI is provided
  image: {
    width: '100%', // Fill the entire container width
    height: '100%', // Fill the entire container height
  },
  // Style for the fallback initial letter text
  initial: {
    color: colors.text.inverse, // White text to contrast against the colored background
    fontWeight: '600', // Semi-bold weight for legibility at small sizes
  },
});
