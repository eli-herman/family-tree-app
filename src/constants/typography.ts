import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Font families
  fontFamily: {
    regular: fontFamily,
    medium: fontFamily,
    semibold: fontFamily,
    bold: fontFamily,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Pre-composed text styles
  textStyles: {
    h1: {
      fontSize: 36,
      fontWeight: '700' as const,
      lineHeight: 43,
    },
    h2: {
      fontSize: 30,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 29,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    buttonSmall: {
      fontSize: 14,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
  },
} as const;

export type Typography = typeof typography;
