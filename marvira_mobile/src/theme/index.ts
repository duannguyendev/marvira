import {colors} from './colors';
import {spacing, borderRadius, fontSize, fontWeight} from './spacing';

// Re-export individual items for convenience
export {colors} from './colors';
export {spacing, borderRadius, fontSize, fontWeight} from './spacing';

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
};

export type Theme = typeof theme;

