/**
 * Spacing Scale and Border Radius Values - Design System Layout Constants
 *
 * This file defines the spacing scale (margins, paddings, gaps) and border radius
 * values used throughout The Vine app. All spacing values follow a consistent scale
 * based on multiples of 4px (the standard "4-point grid") to ensure visual rhythm
 * and alignment across every screen and component.
 *
 * The border radius values control how rounded corners look on cards, buttons,
 * avatars, and other UI elements.
 *
 * Both objects use "as const" so TypeScript treats each number as a literal type,
 * enabling precise type checking in style props.
 *
 * Usage: import { spacing, borderRadius } from '../constants/spacing';
 *        <View style={{ padding: spacing.md, borderRadius: borderRadius.lg }} />
 */

/**
 * spacing - A scale of spacing values (in pixels) used for margins, paddings, and gaps.
 * All values are multiples of 4px for consistent visual rhythm.
 */
export const spacing = {
  xs: 4, // Extra small (4px) - minimal spacing, used for tight gaps between inline elements
  sm: 8, // Small (8px) - used for spacing between closely related elements (e.g., icon and label)
  md: 16, // Medium (16px) - the default spacing for most padding and margins
  lg: 24, // Large (24px) - used for section spacing and generous padding
  xl: 32, // Extra large (32px) - used for major section breaks and screen-level padding
  '2xl': 48, // 2x extra large (48px) - used for large gaps between major content areas
  '3xl': 64, // 3x extra large (64px) - used for hero spacing and top-of-screen gaps
} as const;

/**
 * borderRadius - A scale of border radius values (in pixels) for rounding corners.
 * Smaller values create subtle rounding; larger values create pill shapes.
 * 'full' (9999px) is used for perfect circles (e.g., avatars, round buttons).
 */
export const borderRadius = {
  sm: 4, // Small (4px) - subtle rounding, used for tags and small chips
  md: 8, // Medium (8px) - standard rounding, used for cards and input fields
  lg: 12, // Large (12px) - noticeable rounding, used for prominent cards and modals
  xl: 16, // Extra large (16px) - heavy rounding, used for floating action buttons and bottom sheets
  '2xl': 24, // 2x extra large (24px) - pill-like rounding, used for search bars and large buttons
  full: 9999, // Full circle (9999px) - creates a perfect circle when applied to a square element (used for avatars)
} as const;

/**
 * Spacing - TypeScript type derived from the spacing object.
 * Allows other files to reference the spacing structure as a type.
 */
export type Spacing = typeof spacing;

/**
 * BorderRadius - TypeScript type derived from the borderRadius object.
 * Allows other files to reference the border radius structure as a type.
 */
export type BorderRadius = typeof borderRadius;
