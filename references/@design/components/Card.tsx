/**
 * Card Component
 * @id design-components-card
 * @version 1.0.0
 * @since 2026-03-20
 */

import React from 'react';
import { colors, spacing } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: 12,
        padding: spacing.xl,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
