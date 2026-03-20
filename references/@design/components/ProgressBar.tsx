/**
 * ProgressBar Component
 * @id design-components-progressbar
 * @version 1.0.0
 * @since 2026-03-20
 */

import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  style?: React.CSSProperties;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color,
  style,
}) => {
  return (
    <div
      style={{
        height: 4,
        background: 'rgba(60,51,38,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${value}%`,
          background: color || '#20342f',
          borderRadius: 2,
          transition: 'width 0.3s, background 0.3s',
        }}
      />
    </div>
  );
};

export default ProgressBar;
