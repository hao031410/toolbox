/**
 * Input Component
 * @id design-components-input
 * @version 1.0.0
 * @since 2026-03-20
 */

import React from 'react';
import { colors, spacing } from '../tokens';

interface InputProps {
  value?: string;
  placeholder?: string;
  readOnly?: boolean;
  style?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  value,
  placeholder,
  readOnly,
  style,
}) => {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        padding: `${spacing.sm}px ${spacing.md}px`,
        border: `1px solid ${colors.borderMedium}`,
        borderRadius: 8,
        background: colors.bgElevated,
        color: colors.textPrimary,
        fontSize: 16,
        width: '100%',
        outline: 'none',
        ...style,
      }}
    />
  );
};

export default Input;
