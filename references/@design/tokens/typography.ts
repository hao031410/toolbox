/**
 * Design Tokens - Typography
 * @id design-tokens-typography
 * @version 1.0.0
 * @since 2026-03-20
 */

export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMono: "'SF Mono', Monaco, monospace",

  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export type Typography = typeof typography;
