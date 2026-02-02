export const colors = {
  // Primary Greens - forest/nature theme
  primary: {
    light: '#40916C',
    main: '#2D6A4F',
    dark: '#1B4332',
  },

  // Browns - warm earthy accents
  brown: {
    light: '#A69076',
    main: '#8B7355',
    branch: '#D4C4B0',
  },

  // Warm neutral backgrounds
  background: {
    primary: '#FEFDFB',   // Warm white
    secondary: '#F9F7F4', // Cream
    tertiary: '#F0EDE8',  // Light tan
  },

  // Text colors
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    tertiary: '#A8A29E',
    inverse: '#FFFFFF',
  },

  // Semantic colors
  heart: '#E07A5F',
  success: '#40916C',
  warning: '#E9C46A',
  error: '#E07A5F',

  // Grays (for borders, etc)
  gray: {
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
  },
} as const;

export type ColorPalette = typeof colors;
