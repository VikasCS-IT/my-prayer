import { Platform } from 'react-native';

export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 34,
  },
  lineHeights: {
    xs: 16,
    sm: 18,
    base: 22,
    md: 26,
    lg: 30,
    xl: 34,
    xxl: 38,
    xxxl: 44,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  devanagariFontFamily: Platform.select({
    ios: 'Kohinoor Devanagari',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
};

