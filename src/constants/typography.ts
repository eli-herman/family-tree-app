/**
 * Typography - Design System Font Sizes, Weights, and Pre-Composed Text Styles
 *
 * This file defines the complete typography system for The Vine app.
 * It uses the platform's native system font (San Francisco on iOS, Roboto on Android)
 * for optimal readability and native feel on each platform.
 *
 * The file provides three levels of usage:
 * 1. Individual primitives (fontSize, fontWeight, lineHeight) for custom styles
 * 2. Font family definitions (all set to the system font for now)
 * 3. Pre-composed textStyles (h1-h4, body, caption, button) for quick, consistent usage
 *
 * The "as const" assertion on the entire object and individual weight values ensures
 * TypeScript treats them as literal types, which React Native's style system requires
 * for fontWeight (it expects literal strings like '700', not the generic 'string' type).
 *
 * Usage: import { typography } from '../constants/typography';
 *        <Text style={typography.textStyles.h1}>Title</Text>
 */

import { Platform } from 'react-native';

// Select the appropriate system font based on the current platform.
// iOS uses "System" (which resolves to San Francisco), Android uses "Roboto".
// The 'default' fallback covers web and other platforms.
const fontFamily = Platform.select({
  ios: 'System', // San Francisco - Apple's native system font
  android: 'Roboto', // Google's native system font for Android
  default: 'System', // Fallback for web or other platforms
});

export const typography = {
  // Font families - all currently set to the system font.
  // Having separate entries (regular, medium, semibold, bold) allows future
  // customization if custom fonts with different files per weight are added.
  fontFamily: {
    regular: fontFamily, // Used for normal body text (weight 400)
    medium: fontFamily, // Used for medium-emphasis text (weight 500)
    semibold: fontFamily, // Used for subheadings and buttons (weight 600)
    bold: fontFamily, // Used for headings and emphasis (weight 700)
  },

  // Font sizes - a scale from extra-small (12px) to extra-extra-large (36px).
  // These follow a modular scale for visual harmony across the app.
  fontSize: {
    xs: 12, // Extra small - used for fine print, timestamps, and badges
    sm: 14, // Small - used for captions, secondary text, and small buttons
    base: 16, // Base - the default body text size, comfortable for reading
    lg: 18, // Large - used for slightly emphasized body text
    xl: 20, // Extra large - used for subheadings (h4)
    '2xl': 24, // 2x large - used for section headings (h3)
    '3xl': 30, // 3x large - used for page headings (h2)
    '4xl': 36, // 4x large - used for hero headings (h1)
  },

  // Line height multipliers - control the vertical spacing between lines of text.
  // These are multipliers of the font size (e.g., tight: fontSize * 1.2).
  lineHeight: {
    tight: 1.2, // Compact spacing - used for headings where lines are close together
    normal: 1.5, // Standard spacing - used for body text, comfortable for reading
    relaxed: 1.75, // Loose spacing - used for large blocks of text that need more breathing room
  },

  // Font weights - numeric string values that React Native's style system expects.
  // The "as const" assertion on each value is necessary because React Native requires
  // the fontWeight property to be a literal string type (e.g., '700'), not just 'string'.
  fontWeight: {
    regular: '400' as const, // Normal weight - used for body text and descriptions
    medium: '500' as const, // Medium weight - slightly bolder than regular, for subtle emphasis
    semibold: '600' as const, // Semibold weight - used for subheadings, buttons, and labels
    bold: '700' as const, // Bold weight - used for headings and strong emphasis
  },

  // Pre-composed text styles - ready-to-use style objects that combine fontSize,
  // fontWeight, and lineHeight into complete text styles. Use these directly in
  // component styles for consistency across the app.
  textStyles: {
    // h1 - Hero heading, the largest text style. Used for main screen titles.
    h1: {
      fontSize: 36, // 4xl size
      fontWeight: '700' as const, // Bold
      lineHeight: 43, // ~1.2x the font size (tight)
    },
    // h2 - Page heading. Used for major section titles.
    h2: {
      fontSize: 30, // 3xl size
      fontWeight: '700' as const, // Bold
      lineHeight: 36, // ~1.2x the font size (tight)
    },
    // h3 - Section heading. Used for card titles and subsection headers.
    h3: {
      fontSize: 24, // 2xl size
      fontWeight: '600' as const, // Semibold
      lineHeight: 29, // ~1.2x the font size (tight)
    },
    // h4 - Subheading. Used for list item titles and small headers.
    h4: {
      fontSize: 20, // xl size
      fontWeight: '600' as const, // Semibold
      lineHeight: 24, // ~1.2x the font size (tight)
    },
    // body - Default body text. Used for paragraphs, descriptions, and general content.
    body: {
      fontSize: 16, // Base size
      fontWeight: '400' as const, // Regular weight
      lineHeight: 24, // 1.5x the font size (normal, comfortable reading)
    },
    // bodySmall - Smaller body text. Used for secondary descriptions and supporting info.
    bodySmall: {
      fontSize: 14, // Small size
      fontWeight: '400' as const, // Regular weight
      lineHeight: 21, // 1.5x the font size (normal)
    },
    // caption - Smallest text style. Used for timestamps, labels, and fine print.
    caption: {
      fontSize: 12, // Extra small size
      fontWeight: '400' as const, // Regular weight
      lineHeight: 18, // 1.5x the font size (normal)
    },
    // button - Standard button text. Semibold for clear tap affordance.
    button: {
      fontSize: 16, // Base size, same as body text
      fontWeight: '600' as const, // Semibold for emphasis
      lineHeight: 20, // Tighter than body text for compact button labels
    },
    // buttonSmall - Small button text. Used for secondary/compact buttons.
    buttonSmall: {
      fontSize: 14, // Small size
      fontWeight: '600' as const, // Semibold for emphasis
      lineHeight: 18, // Tight line height for compact buttons
    },
  },
} as const;

/**
 * Typography - TypeScript type derived from the typography object.
 * Allows other files to reference the full typography structure as a type.
 */
export type Typography = typeof typography;
