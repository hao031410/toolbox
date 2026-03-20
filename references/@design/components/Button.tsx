/**
 * Button Component
 * @id design-components-button
 * @version 1.0.0
 * @since 2026-03-20
 */

import React from 'react';
import { colors, spacing } from '../tokens';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  style,
}) => {
  const sizeStyles = {
    sm: { padding: `${spacing.sm}px ${spacing.md}px`, fontSize: 14 },
    md: { padding: `${spacing.md}px ${spacing.lg}px`, fontSize: 16 },
    lg: { padding: `${spacing.md}px ${spacing.lg}px`, fontSize: 16 },
  };

  const variantStyles = {
    primary: {
      background: colors.primary900,
      color: '#fff',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: colors.textSecondary,
      border: `1px solid ${colors.borderMedium}`,
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  );
};

export default Button;
