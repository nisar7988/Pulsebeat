export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 27,
  '5xl': 32,
  full: 9999,
} as const;

export type BorderRadius = typeof borderRadius;
