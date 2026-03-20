/**
 * Design Tokens - Colors
 * @id design-tokens-colors
 * @version 1.0.0
 * @since 2026-03-20
 */

export const colors = {
  // Primary
  primary900: '#20342f',
  primary700: '#2d7a5a',
  primary100: 'rgba(32,52,47,0.05)',

  // Background
  bgPage: '#f5f3f0',
  bgCard: '#ffffff',
  bgElevated: '#faf9f7',

  // Text
  textPrimary: '#3c3326',
  textSecondary: '#5c574e',
  textTertiary: '#8b8075',

  // Border
  borderLight: 'rgba(60,51,38,0.08)',
  borderMedium: 'rgba(60,51,38,0.12)',

  // Status
  success: '#2d7a5a',
  warning: '#b58a2a',
  error: '#b54a2a',
} as const;

export type Colors = typeof colors;
