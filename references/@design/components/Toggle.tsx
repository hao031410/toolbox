/**
 * Toggle Component
 * @id design-components-toggle
 * @version 1.0.0
 * @since 2026-03-20
 */

import React from 'react';
import { colors } from '../tokens';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        background: checked ? colors.primary900 : colors.borderMedium,
        borderRadius: 12,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          background: '#fff',
          borderRadius: '50%',
          position: 'absolute',
          left: 2,
          top: 2,
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
};

export default Toggle;
