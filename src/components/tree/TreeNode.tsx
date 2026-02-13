/**
 * TreeNode.tsx
 *
 * Renders an individual family member as a node in the family tree visualization.
 * Each node is a tappable card containing the member's avatar and display name.
 *
 * Features:
 *   - Three scale levels (normal, small, tiny) for different tree densities
 *   - Three color variants (green, brown, branch) to distinguish generations
 *   - Selection ring overlay when the node is currently selected
 *   - Full accessibility support with labels and state
 *
 * Also exports three simple vine connector helper components (VineVertical,
 * VineHorizontal, VineCorner) that draw thin, circuit-like lines connecting
 * nodes in the family tree. These use the "branch" color from the design system.
 *
 * Exports TREE_NODE_WIDTH and TREE_NODE_HEIGHT constants so other layout
 * components can calculate spacing based on the normal-scale node dimensions.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
// Avatar component for displaying the member's profile picture or initial
import { Avatar } from '../common';
// Design system tokens for colors, spacing, and border radius
import { colors, spacing, borderRadius } from '../../constants';
// TypeScript type for a family member data object
import { FamilyMember } from '../../types';

/**
 * Props for the TreeNode component.
 */
interface TreeNodeProps {
  member: FamilyMember; // The family member data to display in this node
  onPress: (member: FamilyMember) => void; // Callback invoked when the node is tapped
  isSelected?: boolean; // When true, shows a green selection ring around the node
  variant?: 'green' | 'brown' | 'branch'; // Color theme for the avatar (tied to generation depth)
  scale?: 'normal' | 'small' | 'tiny'; // Size scale of the node (affects dimensions, font, avatar)
  style?: ViewStyle; // Additional styles from the parent component
}

/**
 * Aspect ratio for tree nodes (height = width * NODE_ASPECT).
 * This makes nodes slightly taller than they are wide, giving room
 * for the avatar on top and the name below.
 */
const NODE_ASPECT = 1.28;

/**
 * Calculates the node height from a given width using the aspect ratio.
 * Math.round ensures we get whole-pixel values to avoid subpixel rendering.
 *
 * @param node - The node width in pixels
 * @returns The calculated node height, rounded to the nearest pixel
 */
const getNodeHeight = (node: number) => Math.round(node * NODE_ASPECT);

/**
 * Configuration for each scale level, defining the node dimensions,
 * avatar size, font size, and inner padding.
 */
const scaleConfig = {
  normal: {
    node: 100, // 100px wide node
    height: getNodeHeight(100), // ~128px tall
    avatar: 'lg' as const, // Large avatar (56px)
    fontSize: 14, // Standard name font size
    padding: spacing.md, // Medium inner padding
  },
  small: {
    node: 80, // 80px wide node
    height: getNodeHeight(80), // ~102px tall
    avatar: 'md' as const, // Medium avatar (44px)
    fontSize: 12, // Slightly smaller name font
    padding: spacing.sm, // Small inner padding
  },
  tiny: {
    node: 64, // 64px wide node
    height: getNodeHeight(64), // ~82px tall
    avatar: 'sm' as const, // Small avatar (32px)
    fontSize: 10, // Smallest name font
    padding: spacing.xs, // Extra small inner padding
  },
};

/** Exported constant: the pixel width of a normal-scale tree node (100px) */
export const TREE_NODE_WIDTH = scaleConfig.normal.node;

/** Exported constant: the pixel height of a normal-scale tree node (~128px) */
export const TREE_NODE_HEIGHT = scaleConfig.normal.height;

/**
 * TreeNode component - renders a single family member as a tappable card
 * in the family tree view.
 *
 * @param member - The FamilyMember data object to display
 * @param onPress - Callback function called with the member when the node is tapped
 * @param isSelected - Whether this node is currently selected (shows a green ring)
 * @param variant - Color variant for the avatar: 'green', 'brown', or 'branch'
 * @param scale - Size scale: 'normal' (100px), 'small' (80px), or 'tiny' (64px)
 * @param style - Optional additional ViewStyle overrides
 */
export function TreeNode({
  member,
  onPress,
  isSelected,
  variant = 'green', // Default to the green (forest) color variant
  scale = 'normal', // Default to the normal (largest) scale
  style,
}: TreeNodeProps) {
  // Use the member's nickname if available, otherwise fall back to first name
  const displayName = member.nickname || member.firstName;
  // Look up the dimensions, avatar size, font size, and padding for the chosen scale
  const config = scaleConfig[scale];

  return (
    <TouchableOpacity
      style={[
        styles.container, // Base card styles (background, shadow, border, centering)
        { width: config.node, height: config.height, padding: config.padding }, // Scale-specific dimensions
        style, // Any custom styles from the parent
      ]}
      onPress={() => onPress(member)} // Call the onPress callback with this member's data
      activeOpacity={0.8} // Slightly dim on press for touch feedback
      accessibilityRole="button" // Tell screen readers this is an interactive button
      accessibilityLabel={`Open ${displayName}'s profile`} // Describe the node for screen readers
      accessibilityHint="Opens member details" // Explain what tapping does
      accessibilityState={{ selected: !!isSelected }} // Communicate selection state to assistive tech
    >
      {/* When the node is selected, overlay a green ring border around the card */}
      {isSelected && <View pointerEvents="none" style={styles.selectedRing} />}
      {/* Avatar showing the member's photo or initial letter */}
      <Avatar name={displayName} size={config.avatar} variant={variant} />
      {/* Member's display name, truncated to one line if too long */}
      <Text style={[styles.name, { fontSize: config.fontSize }]} numberOfLines={1}>
        {displayName}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * VineVertical - a thin vertical line connector used to link tree nodes
 * across generations. Renders as a 2px-wide View with the branch color.
 *
 * @param height - The height of the vertical vine in pixels (default: 24)
 */
// Thin vine connector components - circuit-like aesthetic
export function VineVertical({ height = 24 }: { height?: number }) {
  // Render a narrow vertical View with the branch brown color
  return <View style={[styles.vineVertical, { height }]} />;
}

/**
 * VineHorizontal - a thin horizontal line connector used to link sibling
 * nodes side by side. Renders as a 2px-tall View with the branch color.
 *
 * @param width - The width of the horizontal vine in pixels (default: 80)
 */
export function VineHorizontal({ width = 80 }: { width?: number }) {
  // Render a narrow horizontal View with the branch brown color
  return <View style={[styles.vineHorizontal, { width }]} />;
}

/**
 * VineCorner - an L-shaped connector that combines a short vertical line
 * with a short horizontal line, creating a corner turn. Used to connect
 * nodes that are not directly above/below each other.
 *
 * @param direction - Which way the horizontal part extends: 'left' or 'right'
 */
export function VineCorner({ direction = 'left' }: { direction?: 'left' | 'right' }) {
  return (
    <View style={styles.vineCornerContainer}>
      {/* Short vertical segment (12px tall) dropping down from the parent */}
      <View style={[styles.vineVertical, { height: 12 }]} />
      {/* Short horizontal segment (20px wide) extending left or right */}
      <View
        style={[
          styles.vineHorizontal,
          { width: 20 },
          // Use auto margins to push the horizontal line to the left or right side
          direction === 'left' ? { marginRight: 'auto' } : { marginLeft: 'auto' },
        ]}
      />
    </View>
  );
}

/**
 * StyleSheet for the TreeNode and vine connector components.
 * Includes styles for the node card, selection ring, name text,
 * and the three vine connector types (vertical, horizontal, corner).
 */
const styles = StyleSheet.create({
  // Base container for the tree node card
  container: {
    alignItems: 'center', // Center avatar and name horizontally
    borderRadius: borderRadius.lg, // Rounded corners from the design system
    backgroundColor: colors.background.primary, // White background (Warm White)
    shadowColor: '#000', // Black shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow drops 2px below
    shadowOpacity: 0.06, // Very subtle shadow (6% opacity)
    shadowRadius: 8, // Soft shadow spread
    elevation: 2, // Android shadow depth (matches iOS shadow)
    borderWidth: 1.5, // Thin border around the node
    borderColor: colors.background.tertiary, // Light gray border color
    position: 'relative', // Enables absolute positioning of the selection ring overlay
  },
  // Green selection ring that overlays the entire node when isSelected is true
  selectedRing: {
    ...StyleSheet.absoluteFillObject, // Position absolutely to cover the entire container
    borderRadius: borderRadius.lg, // Match the container's border radius
    borderWidth: 2, // Slightly thicker border for visibility
    borderColor: colors.primary.main, // Forest green color for the selection indicator
  },
  // Member's display name shown below the avatar
  name: {
    fontWeight: '600', // Semi-bold for readability
    color: colors.text.primary, // Dark text color
    marginTop: spacing.xs, // Small gap between avatar and name
    textAlign: 'center', // Center the text under the avatar
  },
  // Circuit-like vine styles - thin lines colored with the branch brown
  // Vertical vine: a narrow 2px-wide line
  vineVertical: {
    width: 2, // 2px wide for a thin, circuit-like appearance
    backgroundColor: colors.brown.branch, // Branch color (#D4C4B0)
  },
  // Horizontal vine: a narrow 2px-tall line
  vineHorizontal: {
    height: 2, // 2px tall for a thin, circuit-like appearance
    backgroundColor: colors.brown.branch, // Branch color (#D4C4B0)
  },
  // Container for the VineCorner component that centers its children
  vineCornerContainer: {
    alignItems: 'center', // Center the vertical and horizontal segments
  },
});
