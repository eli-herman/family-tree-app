/**
 * Color Palette - Design System Colors for The Vine
 *
 * This file defines every color used throughout the app. The palette is inspired
 * by nature: forest greens for primary actions, warm browns for earthy accents,
 * creams and warm whites for backgrounds, and a terracotta-like coral for hearts
 * and error states. The design evokes the "vine and branches" theme of John 15:5.
 *
 * The object is declared with "as const" so TypeScript treats each hex value
 * as a literal type (e.g., '#2D6A4F' rather than just 'string'). This enables
 * precise type checking when components reference specific colors.
 *
 * Usage: import { colors } from '../constants/colors';
 *        <View style={{ backgroundColor: colors.background.primary }} />
 */
export const colors = {
  // Primary Greens - the core brand colors inspired by a forest/nature theme
  primary: {
    light: '#40916C', // Light green - used for secondary accents and hover states
    main: '#2D6A4F', // Forest green - the primary brand color, used for buttons and key actions
    dark: '#1B4332', // Deep forest green - used for headers, tab bars, and emphasis
  },

  // Browns - warm earthy accents that complement the greens
  brown: {
    light: '#A69076', // Light brown - used for secondary text on earthy backgrounds
    main: '#8B7355', // Medium brown - used for avatar accent variants and earthy elements
    branch: '#D4C4B0', // Branch/tan color - used for the vine connector lines in the family tree
  },

  // Warm neutral backgrounds - give the app a cozy, organic feel instead of harsh white
  background: {
    primary: '#FEFDFB', // Warm white - the main app background color
    secondary: '#F9F7F4', // Cream - used for cards and secondary surfaces
    tertiary: '#F0EDE8', // Light tan - used for input fields, pressed states, and section dividers
  },

  // Text colors - a warm stone-based gray scale (not blue-gray)
  text: {
    primary: '#1C1917', // Near-black warm gray - used for headings and body text
    secondary: '#57534E', // Medium warm gray - used for secondary/supporting text
    tertiary: '#A8A29E', // Light warm gray - used for placeholder text, timestamps, and captions
    inverse: '#FFFFFF', // White - used for text on dark backgrounds (e.g., text on green buttons)
  },

  // Semantic colors - colors that communicate meaning/status
  heart: '#E07A5F', // Terracotta coral - used for the heart/love reaction button
  success: '#40916C', // Green - used for success messages and confirmations (matches primary.light)
  warning: '#E9C46A', // Warm yellow - used for warning messages and alerts
  error: '#E07A5F', // Terracotta coral - used for error messages and destructive actions (matches heart color)

  // Grays - a warm stone-based gray scale for borders, dividers, and subtle UI elements
  gray: {
    100: '#F5F5F4', // Lightest gray - used for subtle backgrounds and hover states
    200: '#E7E5E4', // Light gray - used for borders and dividers
    300: '#D6D3D1', // Medium-light gray - used for disabled states and secondary borders
    400: '#A8A29E', // Medium gray - used for placeholder text and icons
    500: '#78716C', // Dark gray - used for secondary icons and less prominent text
  },
} as const;

/**
 * ColorPalette - TypeScript type derived from the colors object.
 * This allows other files to reference the full color structure as a type
 * (e.g., for theming utilities or component props that accept the palette).
 */
export type ColorPalette = typeof colors;
