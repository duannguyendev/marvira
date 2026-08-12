import { colors } from './colors';
import { spacing, borderRadius, fontSize, fontWeight } from './spacing';

// Re-export individual items for convenience
export { colors } from './colors';
export { spacing, borderRadius, fontSize, fontWeight } from './spacing';

/** iOS launch + Login/auth backdrop. Android boot splash is solid primary. */
export const splashGradient = [colors.primary, colors.secondary] as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  splashGradient,
};

export type Theme = typeof theme;
