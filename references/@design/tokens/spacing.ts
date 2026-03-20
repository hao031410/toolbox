/**
 * Design Tokens - Spacing
 * @id design-tokens-spacing
 * @version 1.0.0
 * @since 2026-03-20
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type Spacing = typeof spacing;
