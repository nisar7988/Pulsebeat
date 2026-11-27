import { colors, gradients } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { borderRadius } from './borderRadius';

export const theme = {
  colors,
  gradients,
  spacing,
  typography,
  borderRadius,
} as const;

export default theme;

export * from './colors';
export * from './spacing';
export * from './typography';
export * from './borderRadius';
export * from './presets';
export * from './ThemeProvider';
